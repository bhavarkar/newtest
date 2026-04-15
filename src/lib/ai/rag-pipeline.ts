import { createAdminClient } from "@/lib/supabase/admin";
import { generateEmbedding } from "./embeddings";
import { generateChatResponse } from "./gemini";
import { buildSystemPrompt } from "./system-prompts";
import type { Tenant, AIAgent, Message } from "@/types";

interface RAGResult {
  response: string;
  withinLimits: boolean;
  limitMessage?: string;
}

/**
 * Full RAG Pipeline:
 * 1. Check usage limits
 * 2. Embed incoming message
 * 3. Vector search knowledge base
 * 4. Build context from chunks
 * 5. Get conversation history
 * 6. Generate AI response via Gemini Flash
 */
export async function runRAGPipeline(
  tenant: Tenant,
  agent: AIAgent,
  conversationId: string,
  userMessage: string
): Promise<RAGResult> {
  const supabase = createAdminClient();

  // 1. Check usage limits
  const { data: limits } = await supabase.rpc("check_usage_limits", {
    p_tenant_id: tenant.id,
  });

  if (limits && limits[0]) {
    const limitCheck = limits[0];

    if (limitCheck.trial_expired) {
      return {
        response: "",
        withinLimits: false,
        limitMessage:
          "Your free trial has expired. Please upgrade to continue using your AI agent. Visit your dashboard for upgrade options.",
      };
    }

    if (!limitCheck.within_limits) {
      return {
        response: "",
        withinLimits: false,
        limitMessage:
          "You've reached your monthly usage limit. Upgrade your plan to continue: " +
          (process.env.NEXT_PUBLIC_APP_URL || "https://app.dataagent.in") +
          "/dashboard/billing",
      };
    }
  }

  // 2. Embed the incoming message
  let queryEmbedding: number[];
  try {
    queryEmbedding = await generateEmbedding(userMessage);
  } catch (err) {
    console.error("Embedding generation failed:", err);
    queryEmbedding = [];
  }

  // 3. Vector search knowledge base for relevant context
  let context = "";
  if (queryEmbedding.length > 0) {
    const { data: matches } = await supabase.rpc("match_knowledge_base", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_tenant_id: tenant.id,
      match_count: 5,
      match_threshold: 0.3,
    });

    if (matches && matches.length > 0) {
      context = matches
        .map(
          (m: { content: string; source_name: string; similarity: number }) =>
            `[Source: ${m.source_name}] ${m.content}`
        )
        .join("\n\n");
    }
  }

  // 4. Get conversation history (last 10 messages)
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(10);

  const conversationHistory: Array<{ role: "user" | "model"; content: string }> =
    (messages || []).map((msg: Message) => ({
      role: msg.sender === "customer" ? ("user" as const) : ("model" as const),
      content: msg.content,
    }));

  // 5. Build system prompt
  const systemPrompt = buildSystemPrompt(
    agent.industry_template,
    agent.agent_name,
    tenant.company_name,
    agent.system_prompt || undefined
  );

  // 6. Generate AI response
  const response = await generateChatResponse(
    systemPrompt,
    conversationHistory,
    userMessage,
    context || undefined
  );

  // 7. Increment usage counter
  await supabase.rpc("increment_usage", {
    p_tenant_id: tenant.id,
    p_field: "ai_executions",
    p_amount: 1,
  });

  return { response, withinLimits: true };
}
