import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Data Agent — WhatsApp AI Agent Platform",
    template: "%s | Data Agent",
  },
  description:
    "Launch your WhatsApp AI Agent in 5 minutes. Connect your WhatsApp Business Account, pick your industry, and go live with an AI-powered customer engagement agent.",
  keywords: [
    "WhatsApp AI agent",
    "WhatsApp automation",
    "AI chatbot",
    "business WhatsApp",
    "customer engagement",
    "SaaS",
  ],
  authors: [{ name: "Data Agent Services" }],
  openGraph: {
    title: "Data Agent — WhatsApp AI Agent Platform",
    description: "Launch your WhatsApp AI Agent in 5 minutes.",
    url: "https://app.dataagent.in",
    siteName: "Data Agent",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
