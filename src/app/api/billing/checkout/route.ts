import { createPaymentSession } from "@/lib/billing/cashfree";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { PlanType } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = user.app_metadata?.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: "No tenant context" }, { status: 400 });
    }

    const { plan } = await request.json();
    if (!plan || (plan !== "basic" && plan !== "pro")) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Get tenant details for customer object
    const { data: tenant } = await supabase
      .from("tenants")
      .select("owner_email, owner_name, phone_number")
      .eq("id", tenantId)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const session = await createPaymentSession(tenantId, plan as PlanType, {
      email: tenant.owner_email,
      name: tenant.owner_name,
      phone: tenant.phone_number
    });

    return NextResponse.json({
      success: true,
      payment_session_id: session.payment_session_id,
      order_id: session.order_id
    });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
