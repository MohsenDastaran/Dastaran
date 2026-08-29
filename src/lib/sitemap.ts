import { getPosts } from "./posts";
import { getSiteOrigin, pageUrl } from "./site";

type SitemapEntry = {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly";
  priority?: number;
};

function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatPriority(priority: number | undefined) {
  if (priority === undefined) {
    return undefined;
  }
  return priority.toFixed(1);
}

export async function getSitemapEntries(requestUrl?: URL) {
  const origin = getSiteOrigin(requestUrl);
  const posts = await getPosts();
  const entries: Array<SitemapEntry> = [
    { loc: pageUrl("/", origin), changefreq: "weekly", priority: 1 },
    { loc: pageUrl("/blog/", origin), changefreq: "daily", priority: 0.9 },
    {
      loc: pageUrl("/legal-notice/", origin),
      changefreq: "yearly",
      priority: 0.2,
    },
    {
      loc: pageUrl("/privacy-policy/", origin),
      changefreq: "yearly",
      priority: 0.2,
    },
  ];

  for (const post of posts) {
    const lastmod = post.data.modificationDate ?? post.data.publicationDate;
    entries.push({
      loc: pageUrl(`/blog/${post.id}/`, origin),
      lastmod: lastmod.toISOString(),
      changefreq: "monthly",
      priority: 0.8,
    });
  }

  return entries;
}

export function renderUrlset(entries: Array<SitemapEntry>) {
  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastmod
        ? `\n    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>`
        : "";
      const changefreq = entry.changefreq
        ? `\n    <changefreq>${entry.changefreq}</changefreq>`
        : "";
      const priority =
        formatPriority(entry.priority) !== undefined
          ? `\n    <priority>${formatPriority(entry.priority)}</priority>`
          : "";
      return `  <url>
    <loc>${xmlEscape(entry.loc)}</loc>${lastmod}${changefreq}${priority}
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export const SITEMAP_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600",
} as const;

export async function sitemapResponse(requestUrl?: URL) {
  return new Response(renderUrlset(await getSitemapEntries(requestUrl)), {
    headers: SITEMAP_HEADERS,
  });
}
