-- ============================================================
-- Data Agent: Database Functions
-- ============================================================

-- ============================================================
-- Vector Similarity Search for Knowledge Base
-- ============================================================
CREATE OR REPLACE FUNCTION match_knowledge_base(
  query_embedding vector(768),
  match_tenant_id UUID,
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source_type knowledge_source_type,
  source_name TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.content,
    kb.source_type,
    kb.source_name,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM knowledge_base kb
  WHERE kb.tenant_id = match_tenant_id
    AND kb.status = 'ready'
    AND kb.embedding IS NOT NULL
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- Get or Create Usage Metrics for Current Period
-- ============================================================
CREATE OR REPLACE FUNCTION get_or_create_usage(
  p_tenant_id UUID
)
RETURNS usage_metrics
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result usage_metrics;
  period_s DATE;
  period_e DATE;
BEGIN
  period_s := date_trunc('month', now())::date;
  period_e := (date_trunc('month', now()) + interval '1 month' - interval '1 day')::date;

  SELECT * INTO result
  FROM usage_metrics
  WHERE tenant_id = p_tenant_id AND period_start = period_s;

  IF NOT FOUND THEN
    INSERT INTO usage_metrics (tenant_id, period_start, period_end)
    VALUES (p_tenant_id, period_s, period_e)
    RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$$;

-- ============================================================
-- Increment Usage Counter (atomic)
-- ============================================================
CREATE OR REPLACE FUNCTION increment_usage(
  p_tenant_id UUID,
  p_field TEXT,
  p_amount INT DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  period_s DATE;
  period_e DATE;
BEGIN
  period_s := date_trunc('month', now())::date;
  period_e := (date_trunc('month', now()) + interval '1 month' - interval '1 day')::date;

  -- Upsert usage record
  INSERT INTO usage_metrics (tenant_id, period_start, period_end)
  VALUES (p_tenant_id, period_s, period_e)
  ON CONFLICT (tenant_id, period_start) DO NOTHING;

  -- Increment the specified field
  EXECUTE format(
    'UPDATE usage_metrics SET %I = %I + $1 WHERE tenant_id = $2 AND period_start = $3',
    p_field, p_field
  ) USING p_amount, p_tenant_id, period_s;
END;
$$;

-- ============================================================
-- Check Usage Limits
-- ============================================================
CREATE OR REPLACE FUNCTION check_usage_limits(
  p_tenant_id UUID
)
RETURNS TABLE (
  within_limits BOOLEAN,
  ai_executions_used INT,
  ai_executions_limit INT,
  unique_users_used INT,
  unique_users_limit INT,
  trial_expired BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  t tenants;
  u usage_metrics;
  p plans;
  exec_limit INT;
  user_limit INT;
  trial_exp BOOLEAN;
BEGIN
  SELECT * INTO t FROM tenants WHERE id = p_tenant_id;
  SELECT * INTO u FROM get_or_create_usage(p_tenant_id);

  -- Get plan limits
  CASE t.plan
    WHEN 'free' THEN exec_limit := 3500; user_limit := 250;
    WHEN 'basic' THEN exec_limit := -1; user_limit := 600;
    WHEN 'pro' THEN exec_limit := -1; user_limit := -1;
  END CASE;

  -- Check trial expiration
  trial_exp := (t.plan = 'free' AND t.trial_start_date IS NOT NULL 
                AND now() > t.trial_start_date + interval '90 days');

  RETURN QUERY SELECT
    (NOT trial_exp) 
    AND (exec_limit = -1 OR u.ai_executions < exec_limit)
    AND (user_limit = -1 OR u.unique_users < user_limit),
    u.ai_executions,
    exec_limit,
    u.unique_users,
    user_limit,
    trial_exp;
END;
$$;
