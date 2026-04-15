"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CreditCard, Check, ArrowRight, Zap, Crown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PLAN_LIMITS } from "@/lib/constants";
import type { Tenant, UsageMetrics } from "@/types";

export default function BillingPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data: t } = await supabase.from("tenants").select("*").single();
      if (t) setTenant(t);

      const now = new Date();
      const ps = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const { data: u } = await supabase.from("usage_metrics").select("*").eq("period_start", ps).single();
      if (u) setMetrics(u);

      setLoading(false);
    };
    fetch();
  }, []);

  const currentPlan = tenant ? PLAN_LIMITS[tenant.plan as keyof typeof PLAN_LIMITS] : PLAN_LIMITS.free;

  const trialDaysLeft = tenant?.trial_start_date
    ? Math.max(0, 90 - Math.floor((Date.now() - new Date(tenant.trial_start_date).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const plans = [
    {
      key: "free",
      name: "Free Trial",
      price: 0,
      period: "3 months",
      features: ["250 users", "3,500 AI executions", "AI Agent", "Human Handoff", "Basic Analytics"],
      cta: tenant?.plan === "free" ? "Current Plan" : "Downgrade",
      popular: false,
    },
    {
      key: "basic",
      name: "Basic",
      price: 999,
      period: "/month",
      features: ["600 users", "Unlimited executions", "AI Agent", "Human Handoff", "Broadcasts", "Full Analytics"],
      cta: tenant?.plan === "basic" ? "Current Plan" : "Upgrade",
      popular: true,
    },
    {
      key: "pro",
      name: "Pro",
      price: 2499,
      period: "/month",
      features: ["Unlimited users", "Unlimited executions", "AI Agent", "Human Handoff", "Broadcasts", "Full Analytics", "Priority Support"],
      cta: tenant?.plan === "pro" ? "Current Plan" : "Upgrade",
      popular: false,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-32 rounded-xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Billing</h1>
        <p className="text-[var(--muted-foreground)] mt-1">Manage your subscription and usage</p>
      </div>

      {/* Current Plan Banner */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-700 rounded-2xl p-6 mb-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm opacity-80">Current Plan</p>
            <p className="text-2xl font-bold mt-1">{currentPlan.name}</p>
            {tenant?.plan === "free" && (
              <p className="text-sm mt-1 opacity-80">
                {trialDaysLeft > 0
                  ? `${trialDaysLeft} days remaining in trial`
                  : "Trial expired — upgrade to continue"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {tenant?.plan === "free" && (
              <button className="px-6 py-2.5 rounded-xl bg-white text-brand-700 font-medium text-sm hover:bg-white/90 transition-all flex items-center gap-2">
                <Zap className="w-4 h-4" /> Upgrade Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Usage Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--muted-foreground)]">Users</span>
            <span className="font-medium text-[var(--foreground)]">
              {metrics?.unique_users || 0} / {currentPlan.maxUsers === -1 ? "∞" : currentPlan.maxUsers}
            </span>
          </div>
          <div className="h-3 bg-[var(--muted)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] rounded-full transition-all duration-700"
              style={{
                width: currentPlan.maxUsers === -1
                  ? "5%"
                  : `${Math.min(((metrics?.unique_users || 0) / currentPlan.maxUsers) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--muted-foreground)]">AI Executions</span>
            <span className="font-medium text-[var(--foreground)]">
              {metrics?.ai_executions || 0} / {currentPlan.maxExecutions === -1 ? "∞" : currentPlan.maxExecutions}
            </span>
          </div>
          <div className="h-3 bg-[var(--muted)] rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-700"
              style={{
                width: currentPlan.maxExecutions === -1
                  ? "5%"
                  : `${Math.min(((metrics?.ai_executions || 0) / currentPlan.maxExecutions) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Plan Comparison */}
      <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className={`bg-[var(--card)] border rounded-2xl p-6 relative ${
              plan.popular ? "border-[var(--primary)] ring-1 ring-[var(--primary)]" : "border-[var(--border)]"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium flex items-center gap-1">
                <Crown className="w-3 h-3" /> Popular
              </div>
            )}
            <h3 className="text-lg font-bold text-[var(--foreground)]">{plan.name}</h3>
            <div className="mt-2 mb-4">
              <span className="text-3xl font-bold text-[var(--foreground)]">
                {plan.price === 0 ? "Free" : formatCurrency(plan.price)}
              </span>
              <span className="text-sm text-[var(--muted-foreground)]">{plan.period}</span>
            </div>
            <ul className="space-y-2 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                  <Check className="w-4 h-4 text-[var(--primary)] shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button
              disabled={tenant?.plan === plan.key}
              className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                tenant?.plan === plan.key
                  ? "bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed"
                  : plan.popular
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
                  : "bg-[var(--secondary)] text-[var(--secondary-foreground)] border border-[var(--border)] hover:bg-[var(--accent)]"
              }`}
            >
              {plan.cta} {tenant?.plan !== plan.key && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
