"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Radio, Plus, Send, Clock, CalendarClock, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Broadcast } from "@/types";

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", template_name: "", audience: "all" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const fetchBroadcasts = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("broadcasts").select("*").order("created_at", { ascending: false });
    if (data) setBroadcasts(data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const supabase = createClient();
    await supabase.from("broadcasts").insert({
      name: form.name,
      template_name: form.template_name,
      target_segment: { audience: form.audience },
      status: "draft",
    });
    setForm({ name: "", template_name: "", audience: "all" });
    setShowCreate(false);
    fetchBroadcasts();
    setCreating(false);
  };

  const statusStyles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    sent: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    draft: <Clock className="w-3 h-3" />,
    scheduled: <CalendarClock className="w-3 h-3" />,
    sent: <Send className="w-3 h-3" />,
    failed: <Radio className="w-3 h-3" />,
  };

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Broadcasts</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Send bulk WhatsApp messages to your contacts</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" /> Create Broadcast
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-6 animate-[slide-down_0.2s_ease-out]">
          <h3 className="font-semibold text-[var(--foreground)] mb-4">New Broadcast</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Broadcast Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. April Promotions"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Template Name</label>
                <input
                  type="text"
                  value={form.template_name}
                  onChange={(e) => setForm({ ...form, template_name: e.target.value })}
                  placeholder="Meta-approved template name"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Audience</label>
              <div className="flex gap-2">
                {["all", "tag", "manual"].map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setForm({ ...form, audience: a })}
                    className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all border ${
                      form.audience === a
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                        : "bg-[var(--background)] text-[var(--foreground)] border-[var(--input)] hover:border-[var(--primary)]"
                    }`}
                  >
                    {a === "all" ? "All Contacts" : a === "tag" ? "By Tag" : "Manual Selection"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-[var(--muted-foreground)]">Cancel</button>
              <button type="submit" disabled={creating} className="px-6 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                {creating && <Loader2 className="w-4 h-4 animate-spin" />} Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Broadcasts Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                <th className="text-left p-4 font-medium text-[var(--muted-foreground)]">Name</th>
                <th className="text-left p-4 font-medium text-[var(--muted-foreground)]">Template</th>
                <th className="text-left p-4 font-medium text-[var(--muted-foreground)]">Status</th>
                <th className="text-left p-4 font-medium text-[var(--muted-foreground)]">Sent</th>
                <th className="text-left p-4 font-medium text-[var(--muted-foreground)]">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}><td colSpan={5} className="p-4"><div className="skeleton h-6 rounded" /></td></tr>
                ))
              ) : broadcasts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[var(--muted-foreground)]">
                    <Radio className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No broadcasts yet. Create your first one!</p>
                  </td>
                </tr>
              ) : (
                broadcasts.map((b) => (
                  <tr key={b.id} className="hover:bg-[var(--accent)] transition-colors">
                    <td className="p-4 font-medium text-[var(--foreground)]">{b.name}</td>
                    <td className="p-4 text-[var(--muted-foreground)] font-mono text-xs">{b.template_name}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[b.status]}`}>
                        {statusIcons[b.status]} {b.status}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--foreground)]">{b.sent_count}</td>
                    <td className="p-4 text-[var(--muted-foreground)]">{formatDate(b.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
