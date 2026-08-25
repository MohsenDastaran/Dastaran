import { fetchBlogPosts } from "./blog-api";

/**
 * The sitemap integration can't read a page's source (see the Astro docs note
 * on `serialize`), so we derive `lastmod` from API post dates and hand it back
 * as a `pathname -> ISO date` map. This gives crawlers an accurate freshness
 * signal per post instead of the build date.
 */
export async function getLastmodMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const posts = await fetchBlogPosts();

  for (const post of posts) {
    const lastmod = post.modificationDate ?? post.publicationDate;
    map.set(`/blog/${post.slug}`, lastmod.toISOString());
  }

  return map;
}
