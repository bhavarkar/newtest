import Link from "next/link";
import {
  MessageSquare,
  Bot,
  Zap,
  ArrowRight,
  CheckCircle2,
  Globe,
  Users,
  BarChart3,
  Shield,
  Star,
} from "lucide-react";
import { INDUSTRIES } from "@/lib/constants";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-[var(--primary-foreground)]" />
            </div>
            <span className="font-bold text-lg text-[var(--foreground)]">Data Agent</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">Features</a>
            <a href="#industries" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">Industries</a>
            <a href="#pricing" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">
              Login
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-all"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/5 to-transparent" />
        <div className="max-w-6xl mx-auto px-4 py-20 lg:py-32 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-medium mb-6 animate-[fade-in_0.5s_ease-out]">
              <Zap className="w-4 h-4" /> Powered by Google Gemini AI
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--foreground)] leading-tight tracking-tight animate-[fade-in_0.5s_ease-out_0.1s_both]">
              Your WhatsApp.{" "}
              <span className="text-[var(--primary)]">Supercharged</span> with AI.
            </h1>
            <p className="text-lg sm:text-xl text-[var(--muted-foreground)] mt-6 mb-8 animate-[fade-in_0.5s_ease-out_0.2s_both]">
              Deploy an intelligent AI agent on your WhatsApp Business in minutes.
              Auto-reply to customers, capture leads, and close sales — 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center animate-[fade-in_0.5s_ease-out_0.3s_both]">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium text-lg hover:opacity-90 transition-all shadow-lg shadow-[var(--primary)]/20"
              >
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[var(--secondary)] text-[var(--secondary-foreground)] font-medium border border-[var(--border)] hover:bg-[var(--accent)] transition-all"
              >
                See How It Works
              </a>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mt-4 animate-[fade-in_0.5s_ease-out_0.4s_both]">
              No credit card required • 3-month free trial • Set up in 5 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-[var(--border)] bg-[var(--muted)]/30">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-[var(--muted-foreground)] mb-6">Trusted by 100+ businesses across India</p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-50">
            {["📍 Clinics", "📚 Coaching Centers", "🛒 E-Commerce", "🏠 Real Estate", "💼 CA Firms", "🍽️ Restaurants"].map((b) => (
              <span key={b} className="text-lg text-[var(--foreground)] font-medium">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--foreground)]">
              Everything you need for WhatsApp automation
            </h2>
            <p className="text-[var(--muted-foreground)] mt-3 text-lg">
              From first message to sale — fully automated
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Bot className="w-6 h-6" />,
                title: "AI-Powered Conversations",
                desc: "Gemini Flash-powered agent that understands context, answers questions, and captures leads autonomously.",
                color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
              },
              {
                icon: <Globe className="w-6 h-6" />,
                title: "Auto-Learn from Website",
                desc: "Paste your URL and your AI learns everything about your business — services, pricing, FAQs — instantly.",
                color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30",
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Human Handoff",
                desc: "Seamlessly transfer complex queries to your team. Take over any conversation with one click.",
                color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30",
              },
              {
                icon: <MessageSquare className="w-6 h-6" />,
                title: "Bulk Broadcasts",
                desc: "Send promotional messages to all your contacts using Meta-approved templates. No spam.",
                color: "bg-green-100 text-green-600 dark:bg-green-900/30",
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Real-time Analytics",
                desc: "Track conversations, AI resolution rate, lead capture, and agent performance in a live dashboard.",
                color: "bg-rose-100 text-rose-600 dark:bg-rose-900/30",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Enterprise Security",
                desc: "AES-256 encrypted tokens, row-level security, and GDPR-compliant data handling.",
                color: "bg-slate-100 text-slate-600 dark:bg-slate-900/30",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 hover:shadow-lg transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.color} group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className="py-20 bg-[var(--muted)]/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--foreground)]">
              Built for your industry
            </h2>
            <p className="text-[var(--muted-foreground)] mt-3 text-lg">
              Pre-configured AI agents trained for your specific business
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {INDUSTRIES.map((industry) => (
              <div
                key={industry.value}
                className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 text-center hover:border-[var(--primary)] hover:shadow-md transition-all cursor-pointer group"
              >
                <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">{industry.icon}</span>
                <p className="text-sm font-medium text-[var(--foreground)]">{industry.label}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">{industry.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--foreground)]">Simple, transparent pricing</h2>
            <p className="text-[var(--muted-foreground)] mt-3 text-lg">Start free, upgrade when ready</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: "Free Trial", price: "₹0", period: "for 3 months", features: ["250 users", "3,500 AI executions", "AI Agent", "Human Handoff", "Basic Analytics"], cta: "Start Free", popular: false },
              { name: "Basic", price: "₹999", period: "/month", features: ["600 users", "Unlimited executions", "AI Agent", "Human Handoff", "Broadcasts", "Full Analytics"], cta: "Get Started", popular: true },
              { name: "Pro", price: "₹2,499", period: "/month", features: ["Unlimited users", "Unlimited executions", "Everything in Basic", "Priority Support", "API Access", "Custom Integrations"], cta: "Contact Sales", popular: false },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`bg-[var(--card)] border rounded-2xl p-6 relative ${
                  plan.popular ? "border-[var(--primary)] ring-1 ring-[var(--primary)] scale-105" : "border-[var(--border)]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" /> Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold text-[var(--foreground)]">{plan.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold text-[var(--foreground)]">{plan.price}</span>
                  <span className="text-sm text-[var(--muted-foreground)]"> {plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                      <CheckCircle2 className="w-4 h-4 text-[var(--primary)] shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block text-center py-2.5 rounded-xl text-sm font-medium transition-all ${
                    plan.popular
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
                      : "bg-[var(--secondary)] text-[var(--secondary-foreground)] border border-[var(--border)] hover:bg-[var(--accent)]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-3xl p-8 sm:p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to supercharge your WhatsApp?</h2>
            <p className="text-lg opacity-90 mb-8">
              Join 100+ businesses using Data Agent to automate customer engagement
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-brand-700 font-medium text-lg hover:bg-white/90 transition-all shadow-lg"
            >
              Start Your Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[var(--primary)] rounded-md flex items-center justify-center">
              <MessageSquare className="w-3 h-3 text-[var(--primary-foreground)]" />
            </div>
            <span className="text-sm font-semibold text-[var(--foreground)]">Data Agent</span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            © {new Date().getFullYear()} Data Agent Services. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-[var(--muted-foreground)]">
            <a href="#" className="hover:text-[var(--foreground)]">Privacy</a>
            <a href="#" className="hover:text-[var(--foreground)]">Terms</a>
            <a href="#" className="hover:text-[var(--foreground)]">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
