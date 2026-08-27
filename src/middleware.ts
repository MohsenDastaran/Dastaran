import { defineMiddleware } from "astro:middleware";
import { API_BASE_URL, BLOG_API_TOKEN } from "astro:env/server";

// Astro does not put secrets on `process.env` in `astro dev`. The blog client
// reads `process.env` / `.env` via Vite `loadEnv`, so copy schema env here
// before SSR pages fetch `{API_BASE_URL}/posts`.
export const onRequest = defineMiddleware((_context, next) => {
  if (API_BASE_URL && !process.env.API_BASE_URL) {
    process.env.API_BASE_URL = API_BASE_URL;
  }
  if (BLOG_API_TOKEN && !process.env.BLOG_API_TOKEN) {
    process.env.BLOG_API_TOKEN = BLOG_API_TOKEN;
  }
  return next();
});
