import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantId = user.app_metadata?.tenant_id;
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 });

    const { conversation_id, content } = await request.json();
    if (!conversation_id || !content) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Get conversation
    const { data: convo } = await admin
      .from("conversations")
      .select("*")
      .eq("id", conversation_id)
      .eq("tenant_id", tenantId)
      .single();

    if (!convo) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    // Get tenant for WhatsApp creds
    const { data: tenant } = await admin
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .single();

    if (!tenant?.whatsapp_token || !tenant?.phone_number_id) {
      return NextResponse.json({ error: "WhatsApp not configured" }, { status: 400 });
    }

    // Send via WhatsApp
    const { decrypt } = await import("@/lib/encryption");
    const { sendWhatsAppMessage } = await import("@/lib/meta/whatsapp");
    const token = decrypt(tenant.whatsapp_token);

    const result = await sendWhatsAppMessage(
      tenant.phone_number_id,
      token,
      convo.contact_phone,
      content
    );

    // Store message
    await admin.from("messages").insert({
      conversation_id,
      tenant_id: tenantId,
      direction: "outbound",
      sender: "human",
      content,
      message_type: "text",
      wamid: result?.wamid || null,
    });

    // Update conversation
    await admin
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: content.substring(0, 100),
      })
      .eq("id", conversation_id);

    return NextResponse.json({ success: true, wamid: result?.wamid });
  } catch (err) {
    console.error("Send message error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
