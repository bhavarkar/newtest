import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/encryption";
import { sendWhatsAppMessage, markMessageAsRead } from "@/lib/meta/whatsapp";
import { runRAGPipeline } from "@/lib/ai/rag-pipeline";
import { NextResponse } from "next/server";
import type { WhatsAppWebhookPayload } from "@/types";

/**
 * GET: Webhook verification
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    console.log("Webhook verified");
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

/**
 * POST: Incoming WhatsApp messages
 */
export async function POST(request: Request) {
  try {
    const body: WhatsAppWebhookPayload = await request.json();

    // Always return 200 quickly to Meta
    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ status: "ok" });
    }

    // Process asynchronously
    processWebhook(body).catch(console.error);

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook POST error:", err);
    return NextResponse.json({ status: "ok" });
  }
}

async function processWebhook(body: WhatsAppWebhookPayload) {
  const supabase = createAdminClient();

  for (const entry of body.entry) {
    for (const change of entry.changes) {
      if (change.field !== "messages") continue;

      const { metadata, messages, contacts } = change.value;
      if (!messages || messages.length === 0) continue;

      const phoneNumberId = metadata.phone_number_id;

      // 1. Find tenant by phone_number_id
      const { data: tenant, error: tenantErr } = await supabase
        .from("tenants")
        .select("*")
        .eq("phone_number_id", phoneNumberId)
        .single();

      if (tenantErr || !tenant) {
        console.error("Tenant not found for phone_number_id:", phoneNumberId);
        continue;
      }

      for (const message of messages) {
        // Only handle text messages for now
        if (message.type !== "text" || !message.text?.body) continue;

        const senderPhone = message.from;
        const senderName = contacts?.[0]?.profile?.name || senderPhone;
        const messageText = message.text.body;
        const wamid = message.id;

        // 2. Find or create conversation
        let { data: conversation } = await supabase
          .from("conversations")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("contact_phone", senderPhone)
          .single();

        if (!conversation) {
          const { data: newConv } = await supabase
            .from("conversations")
            .insert({
              tenant_id: tenant.id,
              contact_phone: senderPhone,
              contact_name: senderName,
              status: "bot",
              last_message_at: new Date().toISOString(),
              last_message_preview: messageText.substring(0, 100),
            })
            .select()
            .single();

          conversation = newConv;
        } else {
          // Update last message
          await supabase
            .from("conversations")
            .update({
              last_message_at: new Date().toISOString(),
              last_message_preview: messageText.substring(0, 100),
              contact_name: senderName,
            })
            .eq("id", conversation.id);
        }

        if (!conversation) continue;

        // 3. Store incoming message
        await supabase.from("messages").insert({
          conversation_id: conversation.id,
          tenant_id: tenant.id,
          direction: "inbound",
          sender: "customer",
          content: messageText,
          message_type: "text",
          wamid,
        });

        // 4. Upsert contact
        await supabase
          .from("contacts")
          .upsert(
            {
              tenant_id: tenant.id,
              phone: senderPhone,
              name: senderName,
              last_seen: new Date().toISOString(),
              opted_in: true,
            },
            { onConflict: "tenant_id,phone" }
          );

        // 5. Increment usage
        await supabase.rpc("increment_usage", {
          p_tenant_id: tenant.id,
          p_field: "messages_received",
          p_amount: 1,
        });

        // Mark as read
        if (tenant.whatsapp_token) {
          const token = decrypt(tenant.whatsapp_token);
          markMessageAsRead(phoneNumberId, token, wamid).catch(console.error);
        }

        // 6. Check conversation status
        if (conversation.status === "human") {
          // Human mode — don't run AI, just notify via Supabase Realtime
          console.log("Conversation in human mode, skipping AI");
          continue;
        }

        // 7. Run RAG pipeline (bot mode)
        const { data: agent } = await supabase
          .from("ai_agents")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("is_active", true)
          .single();

        if (!agent) {
          console.error("No active AI agent for tenant:", tenant.id);
          continue;
        }

        const ragResult = await runRAGPipeline(
          tenant,
          agent,
          conversation.id,
          messageText
        );

        // 8. Send response
        const responseText = ragResult.withinLimits
          ? ragResult.response
          : ragResult.limitMessage || "Service temporarily unavailable.";

        if (tenant.whatsapp_token && tenant.phone_number_id) {
          const token = decrypt(tenant.whatsapp_token);
          const sendResult = await sendWhatsAppMessage(
            tenant.phone_number_id,
            token,
            senderPhone,
            responseText
          );

          // 9. Store bot response
          await supabase.from("messages").insert({
            conversation_id: conversation.id,
            tenant_id: tenant.id,
            direction: "outbound",
            sender: "bot",
            content: responseText,
            message_type: "text",
            wamid: sendResult?.wamid || null,
          });

          // Update conversation last message
          await supabase
            .from("conversations")
            .update({
              last_message_at: new Date().toISOString(),
              last_message_preview: responseText.substring(0, 100),
            })
            .eq("id", conversation.id);

          // Increment messages sent
          await supabase.rpc("increment_usage", {
            p_tenant_id: tenant.id,
            p_field: "messages_sent",
            p_amount: 1,
          });
        }
      }
    }
  }
}
