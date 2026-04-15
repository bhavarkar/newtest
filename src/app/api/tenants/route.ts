import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      company_name,
      industry,
      owner_email,
      owner_name,
      phone_number,
      website_url,
      user_id,
    } = body;

    if (!company_name || !industry || !owner_email || !owner_name || !user_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({
        company_name,
        industry,
        owner_email,
        owner_name,
        phone_number: phone_number || null,
        website_url: website_url || null,
        status: "pending",
        plan: "free",
        trial_start_date: new Date().toISOString(),
        webhook_verify_token: `da_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`,
      })
      .select()
      .single();

    if (tenantError) {
      console.error("Tenant creation error:", tenantError);
      return NextResponse.json(
        { error: "Failed to create tenant" },
        { status: 500 }
      );
    }

    // 2. Create team member link
    const { error: teamError } = await supabase.from("team_members").insert({
      tenant_id: tenant.id,
      user_id,
      email: owner_email,
      name: owner_name,
      role: "owner",
    });

    if (teamError) {
      console.error("Team member link error:", teamError);
    }

    // 3. Create default AI agent for tenant
    const { error: agentError } = await supabase.from("ai_agents").insert({
      tenant_id: tenant.id,
      agent_name: "AI Assistant",
      industry_template: industry,
      system_prompt: "",  // Will be populated from templates
      greeting_message: `Hello! Welcome to ${company_name}. How can I help you today?`,
      tone: "friendly",
      is_active: true,
    });

    if (agentError) {
      console.error("AI agent creation error:", agentError);
    }

    // 4. Update user's app_metadata with tenant_id for RLS
    const { error: metaError } = await supabase.auth.admin.updateUserById(
      user_id,
      {
        app_metadata: { tenant_id: tenant.id },
      }
    );

    if (metaError) {
      console.error("User metadata update error:", metaError);
    }

    // 5. Initialize usage metrics
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    await supabase.from("usage_metrics").insert({
      tenant_id: tenant.id,
      period_start: periodStart.toISOString().split("T")[0],
      period_end: periodEnd.toISOString().split("T")[0],
    });

    return NextResponse.json({ tenant }, { status: 201 });
  } catch (err) {
    console.error("Tenant API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
