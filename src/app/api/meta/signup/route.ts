import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForToken } from "@/lib/meta/whatsapp";
import { encrypt } from "@/lib/encryption";
import { NextResponse } from "next/server";

/**
 * POST: Handle Meta Embedded Signup code exchange
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantId = user.app_metadata?.tenant_id;
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 });

    const { code } = await request.json();
    if (!code) return NextResponse.json({ error: "No auth code" }, { status: 400 });

    // Exchange code for tokens and WABA info
    const result = await exchangeCodeForToken(code);
    if (!result) {
      return NextResponse.json({ error: "Token exchange failed" }, { status: 400 });
    }

    const { accessToken, wabaId, phoneNumberId } = result;

    // Encrypt the token before storing
    const encryptedToken = encrypt(accessToken);

    // Update tenant with WhatsApp credentials
    const admin = createAdminClient();
    const { error } = await admin
      .from("tenants")
      .update({
        waba_id: wabaId,
        phone_number_id: phoneNumberId,
        whatsapp_token: encryptedToken,
        status: "active",
      })
      .eq("id", tenantId);

    if (error) {
      console.error("Update tenant error:", error);
      return NextResponse.json({ error: "Failed to save credentials" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      wabaId,
      phoneNumberId,
    });
  } catch (err) {
    console.error("Meta signup error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
