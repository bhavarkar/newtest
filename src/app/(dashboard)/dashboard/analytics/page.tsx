"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart3,
  TrendingUp,
  MessageSquare,
  Bot,
  Users,
  Calendar,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { UsageMetrics } from "@/types";

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [period, setPeriod] = useState<"7" | "30" | "90">("30");
  const [loading, setLoading] = useState(true);
  const [conversationStats, setConversationStats] = useState({ bot: 0, human: 0, resolved: 0, total: 0 });

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    const supabase = createClient();

    // Get usage metrics
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    const { data: usage } = await supabase
      .from("usage_metrics")
      .select("*")
      .eq("period_start", periodStart)
      .single();

    if (usage) setMetrics(usage);

    // Get conversation counts by status
    const { data: convos } = await supabase
      .from("conversations")
      .select("status");

    if (convos) {
      const stats = { bot: 0, human: 0, resolved: 0, total: convos.length };
      convos.forEach((c) => {
        if (c.status === "bot") stats.bot++;
        else if (c.status === "human") stats.human++;
        else stats.resolved++;
      });
      setConversationStats(stats);
    }

    setLoading(false);
  };

  const resolutionRate = conversationStats.total > 0
    ? Math.round(((conversationStats.bot + conversationStats.resolved) / conversationStats.total) * 100)
    : 0;

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Analytics</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Track your WhatsApp AI agent performance</p>
        </div>
        <div className="flex gap-1 p-1 bg-[var(--muted)] rounded-xl">
          {(["7", "30", "90"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === p
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)]"
              }`}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-[var(--muted-foreground)]">Messages Sent</span>
          </div>
          <p className="text-3xl font-bold text-[var(--foreground)]">
            {loading ? "—" : formatNumber(metrics?.messages_sent || 0)}
          </p>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-[var(--muted-foreground)]">AI Executions</span>
          </div>
          <p className="text-3xl font-bold text-[var(--foreground)]">
            {loading ? "—" : formatNumber(metrics?.ai_executions || 0)}
          </p>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-[var(--muted-foreground)]">Unique Users</span>
          </div>
          <p className="text-3xl font-bold text-[var(--foreground)]">
            {loading ? "—" : formatNumber(metrics?.unique_users || 0)}
          </p>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm text-[var(--muted-foreground)]">Leads Captured</span>
          </div>
          <p className="text-3xl font-bold text-[var(--foreground)]">
            {loading ? "—" : formatNumber(metrics?.leads_captured || 0)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resolution Donut */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">AI vs Human Resolution</h3>
          <div className="flex items-center justify-center gap-8">
            {/* Visual donut made with CSS */}
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 36 36" className="w-40 h-40 -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="3"
                  strokeDasharray={`${resolutionRate}, 100`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold text-[var(--foreground)]">{resolutionRate}%</span>
                <span className="text-xs text-[var(--muted-foreground)]">AI handled</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--primary)]" />
                <span className="text-sm text-[var(--foreground)]">Bot: {conversationStats.bot}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-[var(--foreground)]">Human: {conversationStats.human}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-[var(--foreground)]">Resolved: {conversationStats.resolved}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Overview */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Messages Overview</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--muted-foreground)]">Sent</span>
                <span className="font-medium text-[var(--foreground)]">{formatNumber(metrics?.messages_sent || 0)}</span>
              </div>
              <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min(((metrics?.messages_sent || 0) / Math.max((metrics?.messages_sent || 0) + (metrics?.messages_received || 0), 1)) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--muted-foreground)]">Received</span>
                <span className="font-medium text-[var(--foreground)]">{formatNumber(metrics?.messages_received || 0)}</span>
              </div>
              <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min(((metrics?.messages_received || 0) / Math.max((metrics?.messages_sent || 0) + (metrics?.messages_received || 0), 1)) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--muted-foreground)]">AI Executions</span>
                <span className="font-medium text-[var(--foreground)]">{formatNumber(metrics?.ai_executions || 0)}</span>
              </div>
              <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min(((metrics?.ai_executions || 0) / Math.max(3500, (metrics?.ai_executions || 0))) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
