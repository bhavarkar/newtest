-- ============================================================
-- Data Agent: Seed Data
-- ============================================================

-- Plans
INSERT INTO plans (name, price_inr, max_users, max_executions, features) VALUES
('free', 0, 250, 3500, '{
  "aiAgent": true,
  "humanHandoff": true,
  "broadcasts": false,
  "analytics": "basic",
  "knowledgeSources": 3,
  "trialDays": 90
}'::jsonb),
('basic', 999, 600, -1, '{
  "aiAgent": true,
  "humanHandoff": true,
  "broadcasts": true,
  "analytics": "full",
  "knowledgeSources": 10,
  "trialDays": 0
}'::jsonb),
('pro', 2499, -1, -1, '{
  "aiAgent": true,
  "humanHandoff": true,
  "broadcasts": true,
  "analytics": "full",
  "knowledgeSources": -1,
  "trialDays": 0
}'::jsonb)
ON CONFLICT (name) DO NOTHING;
