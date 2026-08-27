import react from "@astrojs/react";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
import { defineConfig, envField, logHandlers } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import arraybuffer from "vite-plugin-arraybuffer";

import { unified } from "@astrojs/markdown-remark";
import { blogRehypePlugins, blogShikiConfig } from "./src/lib/markdown-config";
import { getLastmodMap } from "./src/lib/sitemap";

// Built once and reused for every sitemap entry rather than per call.
const lastmodMap = await getLastmodMap();

const site = "https://www.dastaran.com/";

export default defineConfig({
  markdown: {
    processor: unified({
      rehypePlugins: blogRehypePlugins,
    }),
    shikiConfig: blogShikiConfig,
  },
  prefetch: true,
  // Structured JSON logs for the SSR functions (chat). `logger` is stable
  // since Astro 7.
  logger: logHandlers.json({ pretty: true }),
  site,
  env: {
    schema: {
      // Optional: only needed in production. Local dev uses a local libSQL file
      // (see src/db/index.ts), so these stay unset and unvalidated locally.
      TURSO_DATABASE_URL: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      TURSO_AUTH_TOKEN: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      BLOG_API_URL: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      BLOG_API_TOKEN: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
    },
  },
  image: {
    remotePatterns: [{ protocol: "https" }],
  },
  integrations: [
    sitemap({
      filter: (page) => !new URL(page).pathname.startsWith("/blog/preview"),
      serialize(item) {
        const pathname = new URL(item.url).pathname.replace(/\/$/, "");
        const lastmod = lastmodMap.get(pathname);
        if (lastmod) {
          item.lastmod = lastmod;
        }
        return item;
      },
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss(), arraybuffer()],
  },
  server: {
    open: true,
    host: true,
  },
  adapter: node({
    mode: "standalone",
  }),
});
