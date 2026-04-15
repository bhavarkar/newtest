import { createAdminClient } from "@/lib/supabase/admin";
import { sendTemplateMessage } from "@/lib/meta/whatsapp";
import { decryptToken } from "@/lib/encryption";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Simple auth check to ensure only our cron/system can hit this
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    
    // Find all scheduled broadcasts past their execution time
    const { data: broadcasts, error: broadcastError } = await admin
      .from("broadcasts")
      .select(`
        *,
        tenants ( id, phone_number_id, whatsapp_token )
      `)
      .eq("status", "scheduled")
      .lte("scheduled_at", new Date().toISOString());

    if (broadcastError) {
      throw broadcastError;
    }

    if (!broadcasts || broadcasts.length === 0) {
      return NextResponse.json({ success: true, processed: 0 });
    }

    let processedCount = 0;

    for (const broadcast of broadcasts) {
      try {
        const tenant = broadcast.tenants;
        if (!tenant || !tenant.phone_number_id || !tenant.whatsapp_token) {
          throw new Error("Missing tenant WhatsApp credentials");
        }

        const accessToken = decryptToken(tenant.whatsapp_token);
        
        // Mark as processing (using 'sent' temporarily, or you could add 'processing' to BroadcastStatus)
        await admin.from("broadcasts").update({ status: "sent" }).eq("id", broadcast.id);

        // Fetch contacts for this tenant (For simple implementation, fetching all opted-in contacts)
        // In real-world, apply `target_segment` filter here
        const { data: contacts, error: contactError } = await admin
          .from("contacts")
          .select("phone, name")
          .eq("tenant_id", tenant.id)
          .eq("opted_in", true);

        if (contactError || !contacts || contacts.length === 0) {
          throw new Error("No valid contacts found");
        }

        let sentSuccessCount = 0;

        // Loop over contacts and send template
        for (const contact of contacts) {
          const res = await sendTemplateMessage(
            tenant.phone_number_id,
            accessToken,
            contact.phone,
            broadcast.template_name,
            "en", // default language
            [{ type: "body", parameters: [{ type: "text", text: contact.name }] }] // rudimentary component mapping
          );

          if (res?.wamid) {
            sentSuccessCount++;
            
            // Log outgoing message
            await admin.from("messages").insert({
              conversation_id: `bcast_${broadcast.id}_${contact.phone}`, // pseudo conversation until replied
              tenant_id: tenant.id,
              direction: "outbound",
              sender: "bot",
              content: `Broadcast: ${broadcast.template_name}`,
              message_type: "template",
              wamid: res.wamid,
            });
          }
        }

        // Finalize broadcast counts
        await admin
          .from("broadcasts")
          .update({ 
            status: "sent",
            sent_count: sentSuccessCount 
          })
          .eq("id", broadcast.id);

        processedCount++;

      } catch (innerError) {
        console.error(`Failed to process broadcast ${broadcast.id}:`, innerError);
        // Mark as failed
        await admin
          .from("broadcasts")
          .update({ status: "failed" })
          .eq("id", broadcast.id);
      }
    }

    return NextResponse.json({ success: true, processed: processedCount });
  } catch (error: any) {
    console.error("Broadcast job error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
