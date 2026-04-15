export type IndustryType =
  | "clinic"
  | "coaching"
  | "ecommerce"
  | "realestate"
  | "ca_finance"
  | "restaurant"
  | "salon";

export type PlanType = "free" | "basic" | "pro";
export type TenantStatus = "active" | "suspended" | "pending";
export type ConversationStatus = "bot" | "human" | "resolved";
export type MessageDirection = "inbound" | "outbound";
export type MessageSender = "bot" | "human" | "customer";
export type MessageType = "text" | "image" | "document" | "template";
export type BroadcastStatus = "draft" | "scheduled" | "sent" | "failed";
export type SubscriptionStatus = "active" | "expired" | "cancelled";
export type KnowledgeSource = "website_scrape" | "pdf_upload" | "manual_faq";

export interface Tenant {
  id: string;
  company_name: string;
  industry: IndustryType;
  owner_email: string;
  owner_name: string;
  phone_number: string;
  waba_id: string | null;
  phone_number_id: string | null;
  whatsapp_token: string | null;
  webhook_verify_token: string | null;
  plan: PlanType;
  trial_start_date: string | null;
  status: TenantStatus;
  logo_url: string | null;
  website_url: string | null;
  created_at: string;
}

export interface AIAgent {
  id: string;
  tenant_id: string;
  agent_name: string;
  industry_template: IndustryType;
  system_prompt: string;
  greeting_message: string;
  tone: string;
  language_mode: string;
  fallback_action: string;
  fallback_message: string;
  notify_owner_on_handoff: boolean;
  is_active: boolean;
  created_at: string;
}

export interface KnowledgeBase {
  id: string;
  tenant_id: string;
  source_type: KnowledgeSource;
  source_name: string;
  content: string;
  embedding: number[] | null;
  metadata: Record<string, unknown> | null;
  status: "processing" | "ready" | "error";
  created_at: string;
}

export interface Conversation {
  id: string;
  tenant_id: string;
  contact_phone: string;
  contact_name: string;
  status: ConversationStatus;
  last_message_at: string;
  last_message_preview: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  tenant_id: string;
  direction: MessageDirection;
  sender: MessageSender;
  content: string;
  message_type: MessageType;
  wamid: string | null;
  created_at: string;
}

export interface Contact {
  id: string;
  tenant_id: string;
  phone: string;
  name: string;
  tags: string[];
  opted_in: boolean;
  last_seen: string | null;
  created_at: string;
}

export interface Broadcast {
  id: string;
  tenant_id: string;
  name: string;
  template_name: string;
  target_segment: Record<string, unknown>;
  status: BroadcastStatus;
  sent_count: number;
  scheduled_at: string | null;
  created_at: string;
}

export interface UsageMetrics {
  id: string;
  tenant_id: string;
  period_start: string;
  period_end: string;
  messages_sent: number;
  messages_received: number;
  ai_executions: number;
  unique_users: number;
  leads_captured: number;
}

export interface Plan {
  id: string;
  name: string;
  price_inr: number;
  max_users: number;
  max_executions: number;
  features: Record<string, unknown>;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  cashfree_subscription_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
}

export interface TeamMember {
  id: string;
  tenant_id: string;
  user_id: string;
  email: string;
  name: string;
  role: "owner" | "agent";
  is_active: boolean;
  created_at: string;
}

// Webhook payload types
export interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppEntry[];
}

export interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

export interface WhatsAppChange {
  value: {
    messaging_product: string;
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    contacts?: Array<{
      profile: { name: string };
      wa_id: string;
    }>;
    messages?: Array<{
      from: string;
      id: string;
      timestamp: string;
      type: string;
      text?: { body: string };
      image?: { id: string; mime_type: string; caption?: string };
      document?: { id: string; mime_type: string; filename?: string };
    }>;
    statuses?: Array<{
      id: string;
      status: string;
      timestamp: string;
      recipient_id: string;
    }>;
  };
  field: string;
}
