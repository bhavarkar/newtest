-- ============================================================
-- Data Agent: Row Level Security Policies
-- ============================================================

-- Helper function: Get tenant_id from JWT custom claim
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'tenant_id')::uuid,
    NULL
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: Check if user is a super admin
CREATE OR REPLACE FUNCTION auth.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM super_admins
    WHERE user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- RLS: tenants
-- ============================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants: users can view own tenant" ON tenants
  FOR SELECT TO authenticated
  USING (id = auth.tenant_id() OR auth.is_super_admin());

CREATE POLICY "Tenants: users can update own tenant" ON tenants
  FOR UPDATE TO authenticated
  USING (id = auth.tenant_id() OR auth.is_super_admin());

-- Insert handled by service role during onboarding

-- ============================================================
-- RLS: team_members
-- ============================================================
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team: members see own tenant teams" ON team_members
  FOR SELECT TO authenticated
  USING (tenant_id = auth.tenant_id() OR auth.is_super_admin());

CREATE POLICY "Team: owners manage members" ON team_members
  FOR ALL TO authenticated
  USING (tenant_id = auth.tenant_id() OR auth.is_super_admin());

-- ============================================================
-- RLS: ai_agents
-- ============================================================
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents: tenant isolation" ON ai_agents
  FOR ALL TO authenticated
  USING (tenant_id = auth.tenant_id() OR auth.is_super_admin());

-- ============================================================
-- RLS: knowledge_base
-- ============================================================
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Knowledge: tenant isolation" ON knowledge_base
  FOR ALL TO authenticated
  USING (tenant_id = auth.tenant_id() OR auth.is_super_admin());

-- ============================================================
-- RLS: conversations
-- ============================================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversations: tenant isolation" ON conversations
  FOR ALL TO authenticated
  USING (tenant_id = auth.tenant_id() OR auth.is_super_admin());

-- ============================================================
-- RLS: messages
-- ============================================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages: tenant isolation" ON messages
  FOR ALL TO authenticated
  USING (tenant_id = auth.tenant_id() OR auth.is_super_admin());

-- ============================================================
-- RLS: contacts
-- ============================================================
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contacts: tenant isolation" ON contacts
  FOR ALL TO authenticated
  USING (tenant_id = auth.tenant_id() OR auth.is_super_admin());

-- ============================================================
-- RLS: broadcasts
-- ============================================================
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Broadcasts: tenant isolation" ON broadcasts
  FOR ALL TO authenticated
  USING (tenant_id = auth.tenant_id() OR auth.is_super_admin());

-- ============================================================
-- RLS: usage_metrics
-- ============================================================
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usage: tenant isolation" ON usage_metrics
  FOR SELECT TO authenticated
  USING (tenant_id = auth.tenant_id() OR auth.is_super_admin());

-- ============================================================
-- RLS: subscriptions
-- ============================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscriptions: tenant isolation" ON subscriptions
  FOR SELECT TO authenticated
  USING (tenant_id = auth.tenant_id() OR auth.is_super_admin());

-- ============================================================
-- RLS: plans (public read)
-- ============================================================
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans: public read" ON plans
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- RLS: super_admins
-- ============================================================
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins: self read" ON super_admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- Trigger: Set tenant_id as JWT custom claim on login
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_tenant_claim()
RETURNS TRIGGER AS $$
DECLARE
  _tenant_id UUID;
BEGIN
  SELECT tm.tenant_id INTO _tenant_id
  FROM team_members tm
  WHERE tm.user_id = NEW.id AND tm.is_active = true
  LIMIT 1;

  IF _tenant_id IS NOT NULL THEN
    -- Update the raw_app_meta_data with tenant_id
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('tenant_id', _tenant_id::text)
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users sign-in (runs on user creation/update)
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_claim();
