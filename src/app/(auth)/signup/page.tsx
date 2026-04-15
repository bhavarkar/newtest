"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, MessageSquare } from "lucide-react";
import { INDUSTRIES } from "@/lib/constants";

export default function SignupPage() {
  const router = useRouter();

  const [step, setStep] = useState<"account" | "business">("account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [phone, setPhone] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === "account") {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      setError(null);
      setStep("business");
      return;
    }

    // Step 2: Create account + tenant
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: ownerName,
          company: companyName,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 2. Create tenant via API (uses service role)
    const tenantRes = await fetch("/api/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_name: companyName,
        industry,
        owner_email: email,
        owner_name: ownerName,
        phone_number: phone,
        website_url: websiteUrl,
        user_id: authData.user?.id,
      }),
    });

    if (!tenantRes.ok) {
      const data = await tenantRes.json();
      setError(data.error || "Failed to create account");
      setLoading(false);
      return;
    }

    router.push("/dashboard/onboarding");
    router.refresh();
  };

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      {/* Logo */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="w-10 h-10 bg-[var(--primary)] rounded-xl flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-[var(--primary-foreground)]" />
        </div>
        <span className="text-2xl font-bold text-[var(--foreground)]">Data Agent</span>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className={`h-1.5 w-16 rounded-full transition-colors ${step === "account" ? "bg-[var(--primary)]" : "bg-[var(--primary)]"}`} />
        <div className={`h-1.5 w-16 rounded-full transition-colors ${step === "business" ? "bg-[var(--primary)]" : "bg-[var(--muted)]"}`} />
      </div>

      {/* Card */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 shadow-[var(--shadow-card)]">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {step === "account" ? "Create your account" : "Tell us about your business"}
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            {step === "account"
              ? "Start your free 3-month trial"
              : "We'll personalize your AI agent"}
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {step === "account" ? (
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Company name
                </label>
                <input
                  id="company"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Healthcare"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Industry
                </label>
                <select
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all"
                >
                  <option value="">Select your industry</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind.value} value={ind.value}>
                      {ind.icon} {ind.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Website URL <span className="text-[var(--muted-foreground)]">(optional)</span>
                </label>
                <input
                  id="website"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all"
                />
              </div>
            </>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            {step === "business" && (
              <button
                type="button"
                onClick={() => setStep("account")}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--secondary)] text-[var(--secondary-foreground)] font-medium hover:opacity-80 transition-all border border-[var(--border)]"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {step === "account" ? "Continue" : "Create account"}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-[var(--muted-foreground)] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--primary)] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
