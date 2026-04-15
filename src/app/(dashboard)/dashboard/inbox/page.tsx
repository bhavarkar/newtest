"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import {
  Send,
  Bot,
  User,
  UserCheck,
  Search,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import { formatTime, formatRelativeTime, truncate } from "@/lib/utils";
import { CONVERSATION_STATUSES } from "@/lib/constants";
import type { Conversation, Message } from "@/types";

function InboxContent() {
  const searchParams = useSearchParams();
  const initialConvoId = searchParams.get("conversation");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(initialConvoId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [filter, setFilter] = useState<"all" | "bot" | "human" | "resolved">("all");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    const query = supabase
      .from("conversations")
      .select("*")
      .order("last_message_at", { ascending: false });

    const { data } = await query;
    if (data) setConversations(data);
    setLoading(false);
  }, [supabase]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (convoId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);
  }, [supabase]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activeConvo) {
      fetchMessages(activeConvo);
    }
  }, [activeConvo, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("inbox-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.conversation_id === activeConvo) {
            setMessages((prev) => [...prev, newMsg]);
          }
          fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConvo, supabase, fetchConversations]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConvo || sending) return;

    setSending(true);
    try {
      await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: activeConvo,
          content: newMessage,
        }),
      });
      setNewMessage("");
    } catch (err) {
      console.error("Send message error:", err);
    }
    setSending(false);
  };

  const handleStatusChange = async (
    convoId: string,
    status: "bot" | "human" | "resolved"
  ) => {
    await supabase
      .from("conversations")
      .update({ status })
      .eq("id", convoId);

    fetchConversations();
  };

  const filteredConversations = conversations.filter((c) => {
    if (filter !== "all" && c.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        c.contact_name?.toLowerCase().includes(s) ||
        c.contact_phone.includes(s)
      );
    }
    return true;
  });

  const activeConversation = conversations.find((c) => c.id === activeConvo);

  return (
    <div className="animate-[fade-in_0.3s_ease-out] -m-6 lg:-m-8 h-[calc(100vh-60px)] lg:h-screen flex">
      {/* Conversation List */}
      <div
        className={`w-full lg:w-96 border-r border-[var(--border)] bg-[var(--card)] flex flex-col ${
          activeConvo ? "hidden lg:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b border-[var(--border)]">
          <h1 className="text-lg font-bold text-[var(--foreground)] mb-3">Inbox</h1>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--background)] border border-[var(--input)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1">
            {(["all", "bot", "human", "resolved"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  filter === f
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                }`}
              >
                {f === "all" ? "All" : CONVERSATION_STATUSES.find((s) => s.value === f)?.icon + " " + f}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-[var(--muted-foreground)] text-sm">
              No conversations found
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConvo;
              const statusConfig = CONVERSATION_STATUSES.find(
                (s) => s.value === conv.status
              );
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvo(conv.id)}
                  className={`w-full text-left p-4 border-b border-[var(--border)] transition-colors ${
                    isActive ? "bg-[var(--accent)]" : "hover:bg-[var(--accent)]/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[var(--foreground)] truncate">
                          {conv.contact_name || conv.contact_phone}
                        </span>
                        <span className="text-xs">{statusConfig?.icon}</span>
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
                        {truncate(conv.last_message_preview || "", 50)}
                      </p>
                    </div>
                    <span className="text-[10px] text-[var(--muted-foreground)] shrink-0">
                      {formatRelativeTime(conv.last_message_at)}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Thread */}
      <div
        className={`flex-1 flex flex-col bg-[var(--background)] ${
          activeConvo ? "flex" : "hidden lg:flex"
        }`}
      >
        {activeConversation ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-[var(--border)] bg-[var(--card)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveConvo(null)}
                  className="lg:hidden text-[var(--muted-foreground)]"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 rounded-full bg-[var(--muted)] flex items-center justify-center">
                  <User className="w-4 h-4 text-[var(--muted-foreground)]" />
                </div>
                <div>
                  <p className="font-medium text-sm text-[var(--foreground)]">
                    {activeConversation.contact_name || activeConversation.contact_phone}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {activeConversation.contact_phone}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {activeConversation.status === "bot" && (
                  <button
                    onClick={() => handleStatusChange(activeConversation.id, "human")}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 transition-colors"
                  >
                    👤 Take Over
                  </button>
                )}
                {activeConversation.status === "human" && (
                  <button
                    onClick={() => handleStatusChange(activeConversation.id, "bot")}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 transition-colors"
                  >
                    🤖 Hand Back
                  </button>
                )}
                {activeConversation.status !== "resolved" && (
                  <button
                    onClick={() => handleStatusChange(activeConversation.id, "resolved")}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 transition-colors"
                  >
                    ✅ Resolve
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2.5 text-sm ${
                      msg.direction === "outbound"
                        ? "chat-bubble-outbound text-[var(--foreground)]"
                        : "chat-bubble-inbound text-[var(--foreground)]"
                    }`}
                  >
                    {msg.sender !== "customer" && (
                      <div className="flex items-center gap-1 mb-1">
                        {msg.sender === "bot" ? (
                          <Bot className="w-3 h-3 text-[var(--primary)]" />
                        ) : (
                          <UserCheck className="w-3 h-3 text-amber-500" />
                        )}
                        <span className="text-[10px] font-medium text-[var(--muted-foreground)]">
                          {msg.sender === "bot" ? "AI Agent" : "Team"}
                        </span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-1 text-right">
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--card)]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  placeholder={
                    activeConversation.status === "bot"
                      ? "Take over to send messages..."
                      : "Type a message..."
                  }
                  disabled={activeConversation.status === "bot"}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending || activeConversation.status === "bot"}
                  className="px-4 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-[var(--muted-foreground)] mx-auto mb-4 opacity-30" />
              <p className="text-[var(--muted-foreground)] text-lg font-medium">
                Select a conversation
              </p>
              <p className="text-[var(--muted-foreground)] text-sm mt-1">
                Choose a conversation from the list to view messages
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" />
        </div>
      }
    >
      <InboxContent />
    </Suspense>
  );
}
