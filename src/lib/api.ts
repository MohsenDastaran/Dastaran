import { loadEnv } from "vite";

const DEFAULT_API_BASE_URL = "https://api.dastaran.com/";

export function readEnv(name: string): string | undefined {
  const fromProcess = process.env[name];
  if (fromProcess) {
    return fromProcess;
  }
  const loaded = loadEnv(
    process.env.NODE_ENV ?? "development",
    process.cwd(),
    "",
  );
  const value = loaded[name];
  return value ? value : undefined;
}

/** API host only, no resource path. Trailing slash is stripped. */
export function getApiBaseUrl() {
  const raw =
    readEnv("API_BASE_URL")?.trim() || readEnv("BLOG_API_URL")?.trim();
  return (raw || DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

/** Join a path onto the API base, e.g. `apiUrl("/posts")`. */
export function apiUrl(path: string) {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${suffix}`;
}
