-- ============================================================
-- Data Agent: Initial Database Schema
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE industry_type AS ENUM (
  'clinic', 'coaching', 'ecommerce', 'realestate',
  'ca_finance', 'restaurant', 'salon'
);

CREATE TYPE plan_type AS ENUM ('free', 'basic', 'pro');
CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'pending');
CREATE TYPE conversation_status AS ENUM ('bot', 'human', 'resolved');
CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE message_sender AS ENUM ('bot', 'human', 'customer');
CREATE TYPE message_type_enum AS ENUM ('text', 'image', 'document', 'template');
CREATE TYPE broadcast_status AS ENUM ('draft', 'scheduled', 'sent', 'failed');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled');
CREATE TYPE knowledge_source_type AS ENUM ('website_scrape', 'pdf_upload', 'manual_faq');
CREATE TYPE knowledge_status AS ENUM ('processing', 'ready', 'error');
CREATE TYPE team_role AS ENUM ('owner', 'agent');

-- ============================================================
-- TABLES
-- ============================================================

-- 1. Plans
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  price_inr INTEGER NOT NULL DEFAULT 0,
  max_users INTEGER NOT NULL DEFAULT 250,
  max_executions INTEGER NOT NULL DEFAULT 3500,
  features JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  industry industry_type NOT NULL DEFAULT 'clinic',
  owner_email TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone_number TEXT,
  waba_id TEXT,
  phone_number_id TEXT,
  whatsapp_token TEXT,  -- encrypted
  webhook_verify_token TEXT,
  plan plan_type NOT NULL DEFAULT 'free',
  trial_start_date TIMESTAMPTZ DEFAULT now(),
  status tenant_status NOT NULL DEFAULT 'pending',
  logo_url TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenants_owner_email ON tenants(owner_email);
CREATE INDEX idx_tenants_phone_number_id ON tenants(phone_number_id);
CREATE INDEX idx_tenants_status ON tenants(status);

-- 3. Team Members (maps Supabase auth users to tenants)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,  -- Supabase auth.users.id
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role team_role NOT NULL DEFAULT 'owner',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_tenant_id ON team_members(tenant_id);

-- 4. AI Agents
CREATE TABLE ai_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL DEFAULT 'AI Assistant',
  industry_template industry_type NOT NULL DEFAULT 'clinic',
  system_prompt TEXT NOT NULL DEFAULT '',
  greeting_message TEXT NOT NULL DEFAULT 'Hello! How can I help you today?',
  tone TEXT NOT NULL DEFAULT 'friendly',
  language_mode TEXT NOT NULL DEFAULT 'auto',
  fallback_action TEXT NOT NULL DEFAULT 'human_handoff',
  fallback_message TEXT NOT NULL DEFAULT 'Let me connect you with a team member who can help you better.',
  notify_owner_on_handoff BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_agents_tenant_id ON ai_agents(tenant_id);

-- 5. Knowledge Base
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_type knowledge_source_type NOT NULL,
  source_name TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  embedding vector(768),
  metadata JSONB DEFAULT '{}',
  status knowledge_status NOT NULL DEFAULT 'processing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_base_tenant_id ON knowledge_base(tenant_id);
CREATE INDEX idx_knowledge_base_embedding ON knowledge_base
  USING hnsw (embedding vector_cosine_ops);

-- 6. Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_phone TEXT NOT NULL,
  contact_name TEXT NOT NULL DEFAULT '',
  status conversation_status NOT NULL DEFAULT 'bot',
  last_message_at TIMESTAMPTZ DEFAULT now(),
  last_message_preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, contact_phone)
);

CREATE INDEX idx_conversations_tenant_id ON conversations(tenant_id);
CREATE INDEX idx_conversations_last_message ON conversations(tenant_id, last_message_at DESC);

-- 7. Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  direction message_direction NOT NULL,
  sender message_sender NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  message_type message_type_enum NOT NULL DEFAULT 'text',
  wamid TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_tenant_id ON messages(tenant_id);
CREATE INDEX idx_messages_created_at ON messages(conversation_id, created_at DESC);

-- 8. Contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  opted_in BOOLEAN NOT NULL DEFAULT true,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, phone)
);

CREATE INDEX idx_contacts_tenant_id ON contacts(tenant_id);
CREATE INDEX idx_contacts_phone ON contacts(tenant_id, phone);

-- 9. Broadcasts
CREATE TABLE broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_name TEXT NOT NULL DEFAULT '',
  target_segment JSONB DEFAULT '{}',
  status broadcast_status NOT NULL DEFAULT 'draft',
  sent_count INTEGER NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_broadcasts_tenant_id ON broadcasts(tenant_id);

-- 10. Usage Metrics
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  messages_sent INTEGER NOT NULL DEFAULT 0,
  messages_received INTEGER NOT NULL DEFAULT 0,
  ai_executions INTEGER NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  leads_captured INTEGER NOT NULL DEFAULT 0,
  UNIQUE(tenant_id, period_start)
);

CREATE INDEX idx_usage_metrics_tenant_id ON usage_metrics(tenant_id);

-- 11. Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  cashfree_subscription_id TEXT,
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_tenant_id ON subscriptions(tenant_id);

-- 12. Super Admins (platform-level)
CREATE TABLE super_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
