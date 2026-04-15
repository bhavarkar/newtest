import { META_GRAPH_API_URL } from "@/lib/constants";

/**
 * Send a text message via WhatsApp Cloud API
 */
export async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string
): Promise<{ wamid: string } | null> {
  try {
    const res = await fetch(
      `${META_GRAPH_API_URL}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { preview_url: false, body: text },
        }),
      }
    );

    const data = await res.json();

    if (data.messages && data.messages[0]) {
      return { wamid: data.messages[0].id };
    }

    console.error("WhatsApp send error:", data);
    return null;
  } catch (err) {
    console.error("WhatsApp send exception:", err);
    return null;
  }
}

/**
 * Send a template message via WhatsApp Cloud API
 */
export async function sendTemplateMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  templateName: string,
  languageCode = "en",
  components?: Array<Record<string, unknown>>
): Promise<{ wamid: string } | null> {
  try {
    const body: Record<string, unknown> = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
      },
    };

    if (components) {
      (body.template as Record<string, unknown>).components = components;
    }

    const res = await fetch(
      `${META_GRAPH_API_URL}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();

    if (data.messages && data.messages[0]) {
      return { wamid: data.messages[0].id };
    }

    console.error("WhatsApp template send error:", data);
    return null;
  } catch (err) {
    console.error("WhatsApp template send exception:", err);
    return null;
  }
}

/**
 * Mark a message as read
 */
export async function markMessageAsRead(
  phoneNumberId: string,
  accessToken: string,
  messageId: string
): Promise<void> {
  try {
    await fetch(`${META_GRAPH_API_URL}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    });
  } catch (err) {
    console.error("Mark as read error:", err);
  }
}

/**
 * Register webhook for a WABA
 */
export async function registerWebhook(
  wabaId: string,
  accessToken: string,
  webhookUrl: string,
  verifyToken: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${META_GRAPH_API_URL}/${wabaId}/subscribed_apps`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error("Webhook registration error:", err);
    return false;
  }
}

/**
 * Exchange auth code for access token (Meta Embedded Signup)
 */
export async function exchangeCodeForToken(
  code: string
): Promise<{ accessToken: string; wabaId: string; phoneNumberId: string } | null> {
  try {
    // Exchange code for short-lived token
    const tokenRes = await fetch(
      `${META_GRAPH_API_URL}/oauth/access_token?` +
        new URLSearchParams({
          client_id: process.env.META_APP_ID!,
          client_secret: process.env.META_APP_SECRET!,
          code,
        }),
      { method: "GET" }
    );

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return null;
    }

    const accessToken = tokenData.access_token;

    // Get WABA ID from debug token or shared WABAs
    const sharedRes = await fetch(
      `${META_GRAPH_API_URL}/debug_token?input_token=${accessToken}`,
      {
        headers: { Authorization: `Bearer ${process.env.META_APP_ID}|${process.env.META_APP_SECRET}` },
      }
    );

    const sharedData = await sharedRes.json();

    // Extract WABA ID and phone number ID from the token data
    const granularScopes = sharedData.data?.granular_scopes || [];
    let wabaId = "";
    let phoneNumberId = "";

    for (const scope of granularScopes) {
      if (scope.permission === "whatsapp_business_management" && scope.target_ids?.[0]) {
        wabaId = scope.target_ids[0];
      }
    }

    // Get phone numbers for this WABA
    if (wabaId) {
      const phoneRes = await fetch(
        `${META_GRAPH_API_URL}/${wabaId}/phone_numbers`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const phoneData = await phoneRes.json();
      if (phoneData.data?.[0]?.id) {
        phoneNumberId = phoneData.data[0].id;
      }
    }

    return { accessToken, wabaId, phoneNumberId };
  } catch (err) {
    console.error("Token exchange exception:", err);
    return null;
  }
}
