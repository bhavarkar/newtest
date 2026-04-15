"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Building2, Globe, Bell, Wifi, ScrollText, Loader2, Save } from "lucide-react";
import type { Tenant } from "@/types";

export default function SettingsPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  useEffect(() => {
    const fetchTenant = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("tenants").select("*").single();
      if (data) setTenant(data);
      setLoading(false);
    };
    fetchTenant();
  }, []);

  const handleSave = async () => {
    if (!tenant) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("tenants").update({
      company_name: tenant.company_name,
      phone_number: tenant.phone_number,
      website_url: tenant.website_url,
    }).eq("id", tenant.id);
    setSaving(false);
  };

  const sections = [
    { id: "profile", label: "Business Profile", icon: <Building2 className="w-4 h-4" /> },
    { id: "whatsapp", label: "WhatsApp", icon: <Wifi className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
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
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Settings</h1>
        <p className="text-[var(--muted-foreground)] mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-56 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible p-1 bg-[var(--muted)] lg:bg-transparent rounded-xl lg:rounded-none">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeSection === s.id
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm lg:bg-[var(--accent)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
          {activeSection === "profile" && tenant && (
            <div className="space-y-5 max-w-lg">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Business Profile</h3>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Company Name</label>
                <input
                  type="text"
                  value={tenant.company_name}
                  onChange={(e) => setTenant({ ...tenant, company_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Email</label>
                <input
                  type="email"
                  value={tenant.owner_email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--muted)] border border-[var(--input)] text-sm text-[var(--muted-foreground)] cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={tenant.phone_number || ""}
                  onChange={(e) => setTenant({ ...tenant, phone_number: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Website</label>
                <input
                  type="url"
                  value={tenant.website_url || ""}
                  onChange={(e) => setTenant({ ...tenant, website_url: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--input)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          )}

          {activeSection === "whatsapp" && tenant && (
            <div className="space-y-5 max-w-lg">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">WhatsApp Connection</h3>
              <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Status</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    tenant.waba_id
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}>
                    {tenant.waba_id ? "✅ Connected" : "⚠️ Not connected"}
                  </span>
                </div>
                {tenant.waba_id && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--muted-foreground)]">WABA ID</span>
                      <span className="text-sm font-mono text-[var(--foreground)]">{tenant.waba_id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--muted-foreground)]">Phone Number ID</span>
                      <span className="text-sm font-mono text-[var(--foreground)]">{tenant.phone_number_id}</span>
                    </div>
                  </>
                )}
              </div>
              {!tenant.waba_id && (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Complete the onboarding wizard to connect your WhatsApp Business Account.
                </p>
              )}
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="space-y-5 max-w-lg">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Notification Preferences</h3>
              {[
                { label: "New conversation alerts", desc: "Get notified when a new customer messages" },
                { label: "Human handoff alerts", desc: "Notify when AI hands off to human" },
                { label: "Daily summary", desc: "Receive a daily summary of conversations" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{item.label}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{item.desc}</p>
                  </div>
                  <button className="w-11 h-6 rounded-full bg-[var(--primary)] transition-colors">
                    <div className="w-5 h-5 rounded-full bg-white shadow translate-x-5 transition-transform" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
