import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs));
}

export function slugify(slug: string) {
  return slug.trim().toLowerCase().replace(/\s+/g, "-");
}

/**
 * Build a page's canonical absolute URL: normalize to a trailing slash so
 * server-rendered routes (`/blog`, `/chat`) match static pages and the sitemap,
 * then resolve against the configured site origin. Shared by the canonical
 * `<link>` and the og:url/twitter:url tags so the two never drift apart.
 */
export function getCanonicalUrl(pathname: string, site: URL | undefined) {
  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return new URL(normalized, site).href;
}
