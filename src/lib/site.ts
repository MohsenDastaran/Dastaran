/** Configured site origin so reverse-proxy Host cannot leak localhost. */
export function getSiteOrigin(requestUrl?: URL) {
  const site = import.meta.env.SITE;
  if (typeof site === "string" && site.length > 0) {
    return new URL(site).origin;
  }
  return requestUrl?.origin ?? "https://www.dastaran.com";
}

/** Absolute URL. HTML paths get a trailing slash to match canonicals. */
export function pageUrl(pathname: string, origin: string) {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const isFile = /\.[a-z0-9]+$/i.test(path);
  const normalized = isFile || path.endsWith("/") ? path : `${path}/`;
  return new URL(normalized, `${origin}/`).href;
}
