import { CASHFREE_PRODUCTION_URL, CASHFREE_SANDBOX_URL, PLAN_LIMITS, PlanType } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";

const getBaseUrl = () =>
  process.env.NODE_ENV === "production" ? CASHFREE_PRODUCTION_URL : CASHFREE_SANDBOX_URL;

const getHeaders = () => ({
  "Content-Type": "application/json",
  "x-client-id": process.env.CASHFREE_APP_ID || "",
  "x-client-secret": process.env.CASHFREE_SECRET_KEY || "",
  "x-api-version": "2023-08-01",
});

/**
 * Creates a Cashfree payment session for a plan subscription
 */
export async function createPaymentSession(tenantId: string, plan: PlanType, customerDetails: { email: string, phone: string, name: string }) {
  if (!process.env.CASHFREE_APP_ID) {
    console.warn("Cashfree not configured. Simulating success.");
    return { payment_session_id: "simulated_" + Date.now(), order_id: "order_" + Date.now() };
  }

  const orderId = `order_${tenantId}_${Date.now()}`;
  const amount = PLAN_LIMITS[plan].price;
  
  if (amount === 0) {
    throw new Error("Cannot create payment session for free plan");
  }

  const response = await fetch(`${getBaseUrl()}/orders`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: tenantId,
        customer_email: customerDetails.email || "support@dataagent.in",
        customer_phone: customerDetails.phone || "9999999999",
        customer_name: customerDetails.name || "Tenant",
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/billing/verify?order_id={order_id}&tenant_id=${tenantId}&plan=${plan}`,
      },
      order_tags: {
        tenant_id: tenantId,
        plan: plan
      }
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Cashfree order creation failed:", error);
    throw new Error(error.message || "Failed to create payment session");
  }

  const data = await response.json();
  return data;
}

/**
 * Verifies a payment with Cashfree
 */
export async function verifyPayment(orderId: string) {
  if (orderId.startsWith("simulated_")) {
    return { order_status: "PAID" };
  }

  const response = await fetch(`${getBaseUrl()}/orders/${orderId}`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to verify payment");
  }

  const data = await response.json();
  return data;
}

/**
 * Handles successful payment, updates tenant plan
 */
export async function handlePaymentSuccess(tenantId: string, plan: PlanType) {
  const admin = createAdminClient();
  
  // Update tenant plan
  const { error: updateError } = await admin
    .from("tenants")
    .update({ plan })
    .eq("id", tenantId);

  if (updateError) {
    console.error("Failed to update tenant plan:", updateError);
    throw new Error("Failed to update tenant plan");
  }

  // Create subscription record
  const now = new Date();
  const endDate = new Date();
  endDate.setMonth(now.getMonth() + 1);

  const { error: subError } = await admin
    .from("subscriptions")
    .insert({
      tenant_id: tenantId,
      plan_id: plan,
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: endDate.toISOString(),
    });

  if (subError) {
    console.error("Failed to create subscription record:", subError);
    // Note: Tenant plan is already updated, this is less critical but should be logged
  }

  return true;
}
