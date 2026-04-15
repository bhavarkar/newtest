import * as cheerio from "cheerio";

interface ScrapedContent {
  title: string;
  content: string;
  url: string;
}

/**
 * Scrape a website's main pages for knowledge base content
 */
export async function scrapeWebsite(baseUrl: string): Promise<ScrapedContent[]> {
  const results: ScrapedContent[] = [];

  // Pages to try scraping
  const paths = ["", "/about", "/about-us", "/services", "/contact", "/products"];

  for (const path of paths) {
    try {
      const url = new URL(path, baseUrl).toString();
      const content = await scrapePage(url);
      if (content) {
        results.push(content);
      }
    } catch (err) {
      // Skip pages that fail
      console.warn(`Failed to scrape ${path}:`, err);
    }
  }

  return results;
}

/**
 * Scrape a single page
 */
async function scrapePage(url: string): Promise<ScrapedContent | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; DataAgent/1.0; +https://dataagent.in)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove scripts, styles, nav, footer
    $("script, style, nav, footer, header, iframe, noscript").remove();

    // Get title
    const title = $("title").text().trim() || $("h1").first().text().trim() || url;

    // Extract meaningful text content
    const textParts: string[] = [];

    // Get meta description
    const metaDesc = $('meta[name="description"]').attr("content");
    if (metaDesc) textParts.push(metaDesc);

    // Get headings and paragraphs
    $("h1, h2, h3, h4, p, li, td, span.content, div.content").each(
      (_, el) => {
        const text = $(el).text().trim();
        if (text.length > 20 && text.length < 2000) {
          textParts.push(text);
        }
      }
    );

    const content = [...new Set(textParts)]
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (content.length < 50) return null;

    return { title, content: content.substring(0, 10000), url };
  } catch {
    return null;
  }
}

/**
 * Extract FAQ-like content from text
 */
export function extractFAQs(text: string): Array<{ question: string; answer: string }> {
  const faqs: Array<{ question: string; answer: string }> = [];
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.endsWith("?") && i + 1 < lines.length) {
      const answer = lines[i + 1].trim();
      if (answer.length > 10) {
        faqs.push({ question: line, answer });
      }
    }
  }

  return faqs;
}
