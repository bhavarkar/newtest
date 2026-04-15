import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { scrapeWebsite } from "@/lib/scraper/website";
import { generateEmbedding, chunkText } from "@/lib/ai/embeddings";
import { NextResponse } from "next/server";

/**
 * POST: Add knowledge source
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantId = user.app_metadata?.tenant_id;
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 });

    const { type, content } = await request.json();
    const admin = createAdminClient();

    if (type === "url") {
      // Scrape website
      const scraped = await scrapeWebsite(content);

      for (const page of scraped) {
        const chunks = chunkText(page.content);

        for (const chunk of chunks) {
          try {
            const embedding = await generateEmbedding(chunk);

            await admin.from("knowledge_base").insert({
              tenant_id: tenantId,
              source_type: "website_scrape",
              source_name: page.title || content,
              content: chunk,
              embedding: JSON.stringify(embedding),
              metadata: { url: page.url },
              status: "ready",
            });
          } catch (err) {
            console.error("Embedding error for chunk:", err);
            await admin.from("knowledge_base").insert({
              tenant_id: tenantId,
              source_type: "website_scrape",
              source_name: page.title || content,
              content: chunk,
              metadata: { url: page.url },
              status: "error",
            });
          }
        }
      }

      return NextResponse.json({ success: true, count: scraped.length });
    }

    if (type === "faq") {
      // Manual FAQ text
      const chunks = chunkText(content);

      for (const chunk of chunks) {
        try {
          const embedding = await generateEmbedding(chunk);

          await admin.from("knowledge_base").insert({
            tenant_id: tenantId,
            source_type: "manual_faq",
            source_name: "Manual FAQ",
            content: chunk,
            embedding: JSON.stringify(embedding),
            status: "ready",
          });
        } catch (err) {
          console.error("Embedding error:", err);
          await admin.from("knowledge_base").insert({
            tenant_id: tenantId,
            source_type: "manual_faq",
            source_name: "Manual FAQ",
            content: chunk,
            status: "error",
          });
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err) {
    console.error("Knowledge API error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * GET: List knowledge sources
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data } = await supabase
      .from("knowledge_base")
      .select("id, source_type, source_name, status, created_at, metadata")
      .order("created_at", { ascending: false });

    return NextResponse.json({ sources: data || [] });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
