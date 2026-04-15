import { verifyPayment, handlePaymentSuccess } from "@/lib/billing/cashfree";
import { PlanType } from "@/lib/constants";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");
    const tenantId = searchParams.get("tenant_id");
    const plan = searchParams.get("plan") as PlanType;

    if (!orderId || !tenantId || !plan) {
      return NextResponse.redirect(new URL("/dashboard/billing?error=invalid_params", request.url));
    }

    const verification = await verifyPayment(orderId);

    if (verification.order_status === "PAID") {
      await handlePaymentSuccess(tenantId, plan);
      return NextResponse.redirect(new URL("/dashboard/billing?success=true", request.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard/billing?error=payment_failed", request.url));
    }
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.redirect(new URL("/dashboard/billing?error=verification_failed", request.url));
  }
}
