import { loadEnv } from "vite";

const DEFAULT_API_BASE_URL = "https://api.dastaran.com/";

export function readEnv(name: string): string | undefined {
  const fromMeta = (import.meta.env as Record<string, string | undefined>)[
    name
  ];
  if (typeof fromMeta === "string" && fromMeta.length > 0) {
    return fromMeta;
  }
  const fromProcess = process.env[name];
  if (fromProcess) {
    return fromProcess;
  }
  const modes = new Set([
    process.env.NODE_ENV,
    import.meta.env.MODE,
    "development",
    "production",
  ]);
  for (const mode of modes) {
    if (!mode) {
      continue;
    }
    const loaded = loadEnv(mode, process.cwd(), "");
    const value = loaded[name];
    if (value) {
      return value;
    }
  }
  return undefined;
}

/** API host only, no resource path. Trailing slash is stripped. */
export function getApiBaseUrl() {
  const raw =
    readEnv("API_BASE_URL")?.trim() || readEnv("BLOG_API_URL")?.trim();
  return (raw || DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

export function getBlogApiToken() {
  return readEnv("BLOG_API_TOKEN");
}

/** Join a path onto the API base, e.g. `apiUrl("/posts")`. */
export function apiUrl(path: string) {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${suffix}`;
}
