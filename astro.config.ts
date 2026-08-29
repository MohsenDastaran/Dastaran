import react from "@astrojs/react";
import node from "@astrojs/node";
import { defineConfig, envField, logHandlers } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import arraybuffer from "vite-plugin-arraybuffer";

import { unified } from "@astrojs/markdown-remark";
import { blogRehypePlugins, blogShikiConfig } from "./src/lib/markdown-config";

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
      API_BASE_URL: envField.string({
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
  integrations: [react()],
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
