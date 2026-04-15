"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Bot,
  BookOpen,
  ShieldAlert,
  MessageSquare,
  Plus,
  Trash2,
  RefreshCw,
  Globe,
  FileText,
  HelpCircle,
  Send,
  Loader2,
} from "lucide-react";
import { INDUSTRIES, TONE_OPTIONS } from "@/lib/constants";
import type { AIAgent, KnowledgeBase } from "@/types";

type Tab = "persona" | "knowledge" | "fallback" | "test";

export default function AIAgentPage() {
  const [activeTab, setActiveTab] = useState<Tab>("persona");
  const [agent, setAgent] = useState<AIAgent | null>(null);
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Test chat state
  const [testMessages, setTestMessages] = useState<Array<{ role: "user" | "bot"; content: string }>>([]);
  const [testInput, setTestInput] = useState("");
  const [testLoading, setTestLoading] = useState(false);

  // Knowledge upload state
  const [showAddKnowledge, setShowAddKnowledge] = useState(false);
  const [knowledgeType, setKnowledgeType] = useState<"url" | "faq">("url");
  const [knowledgeInput, setKnowledgeInput] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAgent();
    fetchKnowledge();
  }, []);

  const fetchAgent = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("is_active", true)
      .single();
    if (data) setAgent(data);
    setLoading(false);
  };

  const fetchKnowledge = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("knowledge_base")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setKnowledgeSources(data);
  };

  const handleSaveAgent = async () => {
    if (!agent) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("ai_agents").update({
      agent_name: agent.agent_name,
      greeting_message: agent.greeting_message,
      tone: agent.tone,
      fallback_message: agent.fallback_message,
      notify_owner_on_handoff: agent.notify_owner_on_handoff,
    }).eq("id", agent.id);
    setSaving(false);
  };

  const handleAddKnowledge = async () => {
    if (!knowledgeInput.trim()) return;
    setUploading(true);
    try {
      await fetch("/api/ai-agent/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: knowledgeType,
          content: knowledgeInput,
        }),
      });
      setKnowledgeInput("");
      setShowAddKnowledge(false);
      fetchKnowledge();
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  const handleDeleteKnowledge = async (id: string) => {
    const supabase = createClient();
    await supabase.from("knowledge_base").delete().eq("id", id);
    fetchKnowledge();
  };

  const handleTestMessage = async () => {
    if (!testInput.trim() || testLoading) return;
    const userMsg = testInput;
    setTestMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setTestInput("");
    setTestLoading(true);

    try {
      const res = await fetch("/api/ai-agent/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setTestMessages((prev) => [...prev, { role: "bot", content: data.response || "No response" }]);
    } catch {
      setTestMessages((prev) => [...prev, { role: "bot", content: "Error getting response" }]);
    }
    setTestLoading(false);
  };

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: "persona", label: "Persona", icon: <Bot className="w-4 h-4" /> },
    { id: "knowledge", label: "Knowledge Base", icon: <BookOpen className="w-4 h-4" /> },
    { id: "fallback", label: "Fallback", icon: <ShieldAlert className="w-4 h-4" /> },
    { id: "test", label: "Test Agent", icon: <MessageSquare className="w-4 h-4" /> },
  ];

  const sourceIcons: Record<string, React.ReactNode> = {
    website_scrape: <Globe className="w-4 h-4 text-blue-500" />,
    pdf_upload: <FileText className="w-4 h-4 text-red-500" />,
    manual_faq: <HelpCircle className="w-4 h-4 text-purple-500" />,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">AI Agent</h1>
        <p className="text-[var(--muted-foreground)] mt-1">Configure and train your WhatsApp AI agent</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-[var(--muted)] rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
        {activeTab === "persona" && agent && (
          <div className="space-y-5 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Agent Name</label>
              <input
                type="text"
                value={agent.agent_name}
                onChange={(e) => setAgent({ ...agent, agent_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Greeting Message</label>
              <textarea
                rows={3}
                value={agent.greeting_message}
                onChange={(e) => setAgent({ ...agent, greeting_message: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Tone</label>
              <div className="grid grid-cols-2 gap-2">
                {TONE_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setAgent({ ...agent, tone: t.value })}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                      agent.tone === t.value
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                        : "bg-[var(--background)] text-[var(--foreground)] border-[var(--input)] hover:border-[var(--primary)]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Industry Template</label>
              <p className="text-sm text-[var(--muted-foreground)] px-4 py-2.5 rounded-xl bg-[var(--muted)]">
                {INDUSTRIES.find((i) => i.value === agent.industry_template)?.icon}{" "}
                {INDUSTRIES.find((i) => i.value === agent.industry_template)?.label}
              </p>
            </div>
            <button
              onClick={handleSaveAgent}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        )}

        {activeTab === "knowledge" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--muted-foreground)]">
                {knowledgeSources.length} knowledge sources
              </p>
              <button
                onClick={() => setShowAddKnowledge(true)}
                className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium flex items-center gap-2 hover:opacity-90"
              >
                <Plus className="w-4 h-4" /> Add Source
              </button>
            </div>

            {showAddKnowledge && (
              <div className="bg-[var(--muted)] rounded-xl p-4 space-y-3 animate-[scale-in_0.2s_ease-out]">
                <div className="flex gap-2">
                  <button
                    onClick={() => setKnowledgeType("url")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      knowledgeType === "url" ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--card)] text-[var(--foreground)]"
                    }`}
                  >
                    🌐 URL
                  </button>
                  <button
                    onClick={() => setKnowledgeType("faq")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      knowledgeType === "faq" ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--card)] text-[var(--foreground)]"
                    }`}
                  >
                    ❓ FAQ Text
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={knowledgeInput}
                  onChange={(e) => setKnowledgeInput(e.target.value)}
                  placeholder={knowledgeType === "url" ? "Enter website URL to scrape..." : "Paste FAQ text here..."}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowAddKnowledge(false)} className="px-3 py-1.5 text-sm text-[var(--muted-foreground)]">Cancel</button>
                  <button onClick={handleAddKnowledge} disabled={uploading} className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                    {uploading && <Loader2 className="w-3 h-3 animate-spin" />} Add
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {knowledgeSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)]/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {sourceIcons[source.source_type]}
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">{source.source_name || source.source_type}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{source.content.substring(0, 80)}...</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      source.status === "ready" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : source.status === "error" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}>
                      {source.status}
                    </span>
                    <button onClick={() => handleDeleteKnowledge(source.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {knowledgeSources.length === 0 && (
                <p className="text-center text-[var(--muted-foreground)] py-8">No knowledge sources yet. Add one to train your AI agent.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "fallback" && agent && (
          <div className="space-y-5 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Fallback Action</label>
              <p className="text-sm text-[var(--muted-foreground)] px-4 py-2.5 rounded-xl bg-[var(--muted)]">
                🔄 Human Handoff (when AI can&apos;t help)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Fallback Message</label>
              <textarea
                rows={3}
                value={agent.fallback_message}
                onChange={(e) => setAgent({ ...agent, fallback_message: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">Notify owner on handoff</p>
                <p className="text-xs text-[var(--muted-foreground)]">Send WhatsApp alert to your number</p>
              </div>
              <button
                onClick={() => setAgent({ ...agent, notify_owner_on_handoff: !agent.notify_owner_on_handoff })}
                className={`w-11 h-6 rounded-full transition-colors ${agent.notify_owner_on_handoff ? "bg-[var(--primary)]" : "bg-[var(--muted)]"}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${agent.notify_owner_on_handoff ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
            <button onClick={handleSaveAgent} disabled={saving} className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
            </button>
          </div>
        )}

        {activeTab === "test" && (
          <div className="max-w-lg">
            <p className="text-sm text-[var(--muted-foreground)] mb-4">Test your AI agent by sending messages below</p>
            <div className="bg-[var(--background)] rounded-xl border border-[var(--border)] h-80 overflow-y-auto p-4 space-y-3 mb-3">
              {testMessages.length === 0 && (
                <p className="text-sm text-[var(--muted-foreground)] text-center py-8">Send a message to test your AI agent</p>
              )}
              {testMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 text-sm ${msg.role === "user" ? "chat-bubble-outbound" : "chat-bubble-inbound"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {testLoading && (
                <div className="flex justify-start">
                  <div className="chat-bubble-inbound px-4 py-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--muted-foreground)]" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTestMessage()}
                placeholder="Type a test message..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
              <button onClick={handleTestMessage} disabled={testLoading} className="px-4 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
