export const INDUSTRIES = [
  { value: "clinic", label: "Clinic / Healthcare", icon: "🏥", description: "Hospitals, clinics, doctors, dentists" },
  { value: "coaching", label: "Coaching / Education", icon: "📚", description: "Coaching institutes, tutoring, online courses" },
  { value: "ecommerce", label: "E-Commerce", icon: "🛒", description: "Online stores, D2C brands, marketplaces" },
  { value: "realestate", label: "Real Estate", icon: "🏠", description: "Brokers, builders, property management" },
  { value: "ca_finance", label: "CA / Finance", icon: "💼", description: "Chartered accountants, financial advisors" },
  { value: "restaurant", label: "Restaurant / Food", icon: "🍽️", description: "Restaurants, cafes, cloud kitchens, catering" },
  { value: "salon", label: "Salon / Beauty", icon: "💅", description: "Salons, spas, beauty parlours" },
] as const;

export type IndustryType = (typeof INDUSTRIES)[number]["value"];

export const PLAN_LIMITS = {
  free: {
    name: "Free Trial",
    price: 0,
    maxUsers: 250,
    maxExecutions: 3500,
    features: {
      aiAgent: true,
      humanHandoff: true,
      broadcasts: false,
      analytics: "basic",
      knowledgeSources: 3,
    },
    trialDays: 90,
  },
  basic: {
    name: "Basic",
    price: 999,
    maxUsers: 600,
    maxExecutions: -1, // unlimited
    features: {
      aiAgent: true,
      humanHandoff: true,
      broadcasts: true,
      analytics: "full",
      knowledgeSources: 10,
    },
    trialDays: 0,
  },
  pro: {
    name: "Pro",
    price: 2499,
    maxUsers: -1, // unlimited
    maxExecutions: -1,
    features: {
      aiAgent: true,
      humanHandoff: true,
      broadcasts: true,
      analytics: "full",
      knowledgeSources: -1,
    },
    trialDays: 0,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
] as const;

export const CONVERSATION_STATUSES = [
  { value: "bot", label: "Bot", icon: "🤖", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "human", label: "Human", icon: "👤", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "resolved", label: "Resolved", icon: "✅", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
] as const;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "LayoutDashboard" },
  { href: "/dashboard/inbox", label: "Inbox", icon: "MessageSquare" },
  { href: "/dashboard/contacts", label: "Contacts", icon: "Users" },
  { href: "/dashboard/broadcasts", label: "Broadcasts", icon: "Radio" },
  { href: "/dashboard/ai-agent", label: "AI Agent", icon: "Bot" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "BarChart3" },
  { href: "/dashboard/settings", label: "Settings", icon: "Settings" },
  { href: "/dashboard/billing", label: "Billing", icon: "CreditCard" },
] as const;

export const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/admin/tenants", label: "Tenants", icon: "Building2" },
  { href: "/admin/plans", label: "Plans & Pricing", icon: "CreditCard" },
  { href: "/admin/analytics", label: "Analytics", icon: "BarChart3" },
  { href: "/admin/templates", label: "Templates", icon: "FileText" },
] as const;

export const META_GRAPH_API_URL = "https://graph.facebook.com/v21.0";
export const CASHFREE_SANDBOX_URL = "https://sandbox.cashfree.com/pg";
export const CASHFREE_PRODUCTION_URL = "https://api.cashfree.com/pg";
