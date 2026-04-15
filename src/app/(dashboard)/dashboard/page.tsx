"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MessageSquare,
  Users,
  Zap,
  TrendingUp,
  UserCheck,
  ArrowUpRight,
  Bot,
} from "lucide-react";
import Link from "next/link";
import { formatRelativeTime, truncate } from "@/lib/utils";
import { CONVERSATION_STATUSES } from "@/lib/constants";
import type { Conversation, UsageMetrics } from "@/types";

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color: string;
}

function MetricCard({ label, value, change, icon, color }: MetricCardProps) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 hover:shadow-[var(--shadow-card-hover)] transition-all group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--muted-foreground)] font-medium">{label}</p>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{value}</p>
          {change && (
            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {change}
            </p>
          )}
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DashboardOverview() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      // Get recent conversations
      const { data: convos } = await supabase
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false })
        .limit(10);

      if (convos) setConversations(convos);

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

      setLoading(false);
    };

    fetchData();
  }, []);

  const todayConvos = conversations.filter((c) => {
    const msgDate = new Date(c.last_message_at);
    const today = new Date();
    return msgDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Overview</h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          Your WhatsApp AI agent at a glance
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <MetricCard
          label="Conversations Today"
          value={loading ? "—" : todayConvos}
          icon={<MessageSquare className="w-5 h-5 text-blue-600" />}
          color="bg-blue-100 dark:bg-blue-900/30"
        />
        <MetricCard
          label="Messages Sent"
          value={loading ? "—" : metrics?.messages_sent || 0}
          change="This month"
          icon={<Zap className="w-5 h-5 text-purple-600" />}
          color="bg-purple-100 dark:bg-purple-900/30"
        />
        <MetricCard
          label="AI Resolution Rate"
          value={
            loading
              ? "—"
              : conversations.length > 0
              ? `${Math.round(
                  (conversations.filter((c) => c.status === "bot" || c.status === "resolved")
                    .length /
                    conversations.length) *
                    100
                )}%`
              : "N/A"
          }
          icon={<Bot className="w-5 h-5 text-green-600" />}
          color="bg-green-100 dark:bg-green-900/30"
        />
        <MetricCard
          label="Leads Captured"
          value={loading ? "—" : metrics?.leads_captured || 0}
          change="This month"
          icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
          color="bg-amber-100 dark:bg-amber-900/30"
        />
        <MetricCard
          label="Active Contacts"
          value={loading ? "—" : metrics?.unique_users || 0}
          icon={<UserCheck className="w-5 h-5 text-rose-600" />}
          color="bg-rose-100 dark:bg-rose-900/30"
        />
      </div>

      {/* Recent Conversations */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Recent Conversations
          </h2>
          <Link
            href="/dashboard/inbox"
            className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1"
          >
            View all <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-3 opacity-50" />
            <p className="text-[var(--muted-foreground)]">
              No conversations yet. Connect your WhatsApp to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {conversations.map((conv) => {
              const statusConfig = CONVERSATION_STATUSES.find(
                (s) => s.value === conv.status
              );
              return (
                <Link
                  key={conv.id}
                  href={`/dashboard/inbox?conversation=${conv.id}`}
                  className="flex items-center justify-between p-4 hover:bg-[var(--accent)] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[var(--muted)] flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-[var(--muted-foreground)]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[var(--foreground)] truncate">
                          {conv.contact_name || conv.contact_phone}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${statusConfig?.color || ""}`}
                        >
                          {statusConfig?.icon} {statusConfig?.label}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
                        {truncate(conv.last_message_preview || "No messages yet", 60)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)] shrink-0 ml-3">
                    {formatRelativeTime(conv.last_message_at)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
