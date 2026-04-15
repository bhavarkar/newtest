import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { runRAGPipeline } from "@/lib/ai/rag-pipeline";
import { NextResponse } from "next/server";

/**
 * POST: Test AI agent response
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantId = user.app_metadata?.tenant_id;
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 });

    const { message } = await request.json();
    if (!message) return NextResponse.json({ error: "No message" }, { status: 400 });

    const admin = createAdminClient();

    // Get tenant and agent
    const { data: tenant } = await admin.from("tenants").select("*").eq("id", tenantId).single();
    const { data: agent } = await admin.from("ai_agents").select("*").eq("tenant_id", tenantId).eq("is_active", true).single();

    if (!tenant || !agent) {
      return NextResponse.json({ error: "Agent not configured" }, { status: 400 });
    }

    // Use a test conversation ID (not stored)
    const result = await runRAGPipeline(tenant, agent, "test-" + tenantId, message);

    return NextResponse.json({
      response: result.withinLimits ? result.response : result.limitMessage,
    });
  } catch (err) {
    console.error("Test agent error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
