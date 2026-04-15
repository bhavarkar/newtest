"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Globe,
  Bot,
  Rocket,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { INDUSTRIES, TONE_OPTIONS } from "@/lib/constants";

type Step = 1 | 2 | 3 | 4;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Step 2: Meta signup
  const [metaConnected, setMetaConnected] = useState(false);

  // Step 3: Agent config
  const [agentName, setAgentName] = useState("AI Assistant");
  const [greeting, setGreeting] = useState("Hi! 👋 How can I help you today?");
  const [tone, setTone] = useState("professional");
  const [websiteUrl, setWebsiteUrl] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.app_metadata?.tenant_id) {
        setTenantId(user.app_metadata.tenant_id);
      }
    });
  }, []);

  // Meta Embedded Signup handler
  const handleMetaSignup = () => {
    // This launches the Facebook Login popup
    if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).FB) {
      const FB = (window as unknown as Record<string, unknown>).FB as {
        login: (
          callback: (response: {
            authResponse?: { code: string };
            status: string;
          }) => void,
          options: Record<string, unknown>
        ) => void;
      };

      FB.login(
        async (response) => {
          if (response.authResponse?.code) {
            setLoading(true);
            try {
              const res = await fetch("/api/meta/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: response.authResponse.code }),
              });
              const data = await res.json();
              if (data.success) {
                setMetaConnected(true);
              }
            } catch (err) {
              console.error("Meta signup error:", err);
            }
            setLoading(false);
          }
        },
        {
          config_id: process.env.NEXT_PUBLIC_META_CONFIG_ID,
          response_type: "code",
          override_default_response_type: true,
          extras: {
            setup: {},
            featureType: "",
            sessionInfoVersion: "3",
          },
        }
      );
    }
  };

  const handleSaveAgent = async () => {
    setLoading(true);
    const supabase = createClient();

    // Update AI agent
    await supabase.from("ai_agents").update({
      agent_name: agentName,
      greeting_message: greeting,
      tone,
    }).eq("tenant_id", tenantId);

    // Scrape website if provided
    if (websiteUrl) {
      await fetch("/api/ai-agent/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "url", content: websiteUrl }),
      });
    }

    setLoading(false);
    setStep(4);
  };

  const steps = [
    { num: 1, label: "Welcome", icon: <Rocket className="w-5 h-5" /> },
    { num: 2, label: "Connect WhatsApp", icon: <MessageSquare className="w-5 h-5" /> },
    { num: 3, label: "Setup AI Agent", icon: <Bot className="w-5 h-5" /> },
    { num: 4, label: "Go Live!", icon: <CheckCircle2 className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-[var(--primary-foreground)]" />
          </div>
          <span className="font-bold text-[var(--foreground)]">Data Agent</span>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-12">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    step >= s.num
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                  }`}
                >
                  {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.icon}
                </div>
                <span className="text-xs mt-2 text-[var(--muted-foreground)] hidden sm:block">
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-12 sm:w-24 h-0.5 mx-2 transition-colors ${
                    step > s.num ? "bg-[var(--primary)]" : "bg-[var(--muted)]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 animate-[fade-in_0.3s_ease-out]">
          {step === 1 && (
            <div className="text-center max-w-lg mx-auto">
              <div className="w-16 h-16 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Rocket className="w-8 h-8 text-[var(--primary)]" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-3">
                Welcome to Data Agent! 🎉
              </h2>
              <p className="text-[var(--muted-foreground)] mb-6">
                Let&apos;s get your WhatsApp AI agent up and running in 3 easy steps.
                Your customers will be chatting with your intelligent assistant within minutes.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
                {[
                  { icon: "💬", title: "Connect WhatsApp", desc: "Link your business number" },
                  { icon: "🤖", title: "Train your AI", desc: "Customise persona & knowledge" },
                  { icon: "🚀", title: "Go Live", desc: "Start engaging customers" },
                ].map((item) => (
                  <div key={item.title} className="p-4 rounded-xl bg-[var(--muted)] text-center">
                    <span className="text-2xl">{item.icon}</span>
                    <p className="text-sm font-medium text-[var(--foreground)] mt-2">{item.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="px-8 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:opacity-90 transition-all flex items-center gap-2 mx-auto"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-lg mx-auto">
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
                Connect Your WhatsApp
              </h2>
              <p className="text-[var(--muted-foreground)] mb-6">
                Link your WhatsApp Business Account using Meta&apos;s secure embedded signup.
              </p>

              {metaConnected ? (
                <div className="p-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <p className="text-lg font-semibold text-green-800 dark:text-green-400">
                    WhatsApp Connected! ✅
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-500 mt-1">
                    Your business account is now linked.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={handleMetaSignup}
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-[#1877F2] text-white font-medium text-lg hover:bg-[#1565C0] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                          <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0022 12.06C22 6.53 17.5 2.04 12 2.04Z" />
                        </svg>
                        Login with Facebook
                      </>
                    )}
                  </button>
                  <p className="text-xs text-center text-[var(--muted-foreground)]">
                    You&apos;ll be asked to allow Data Agent to manage your WhatsApp Business Account.
                  </p>
                </div>
              )}

              <div className="flex justify-between mt-8">
                <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-[var(--muted-foreground)] flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!metaConnected}
                  className="px-6 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium disabled:opacity-30 flex items-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-lg mx-auto">
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
                Configure Your AI Agent
              </h2>
              <p className="text-[var(--muted-foreground)] mb-6">
                Customize how your AI assistant interacts with customers.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Agent Name</label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="e.g. Priya, Alex, Dr. Ravi"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Greeting Message</label>
                  <textarea
                    rows={2}
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Tone</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TONE_OPTIONS.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setTone(t.value)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                          tone === t.value
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
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    Website URL <span className="text-[var(--muted-foreground)] font-normal">(optional – will be scraped for AI training)</span>
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://your-business.com"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button onClick={() => setStep(2)} className="px-4 py-2 text-sm text-[var(--muted-foreground)] flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleSaveAgent}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save & Go Live <Rocket className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center max-w-lg mx-auto">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-[scale-in_0.5s_ease-out]">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-3">
                You&apos;re Live! 🎉
              </h2>
              <p className="text-[var(--muted-foreground)] mb-8">
                Your AI agent is now active and ready to handle customer conversations on WhatsApp.
                Head to your dashboard to monitor conversations and optimize your agent.
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-8 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:opacity-90 transition-all flex items-center gap-2 mx-auto"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Facebook SDK */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.fbAsyncInit = function() {
              FB.init({
                appId: '${process.env.NEXT_PUBLIC_META_APP_ID || ""}',
                cookie: true,
                xfbml: true,
                version: 'v21.0'
              });
            };
            (function(d, s, id){
              var js, fjs = d.getElementsByTagName(s)[0];
              if (d.getElementById(id)) {return;}
              js = d.createElement(s); js.id = id;
              js.src = "https://connect.facebook.net/en_US/sdk.js";
              fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));
          `,
        }}
      />
    </div>
  );
}
