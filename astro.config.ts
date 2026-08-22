import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
import { defineConfig, envField, logHandlers } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import arraybuffer from "vite-plugin-arraybuffer";

// https://docs.astro.build/en/guides/markdown-content/#heading-ids-and-plugins
import { rehypeHeadingIds, unified } from "@astrojs/markdown-remark";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

import {
  transformerMetaDiff,
  transformerMetaHighlight,
} from "./src/lib/shiki/transformerMeta";
import { transformerCodeBlock } from "./src/lib/shiki/transformerCodeBlock";
import { transformerLineNumbers } from "./src/lib/shiki/transformerLineNumbers";
import { getLastmodMap } from "./src/lib/sitemap";

// Built once and reused for every sitemap entry rather than per call.
const lastmodMap = getLastmodMap();

const site = "https://www.dastaran.com/";

export default defineConfig({
  markdown: {
    processor: unified({
      rehypePlugins: [
        rehypeHeadingIds,
        () =>
          rehypeAutolinkHeadings({
            // Has to be inside the heading, because the font-size for the anchor adjusts to the heading
            behavior: "prepend",
            content: {
              type: "text",
              value: "#",
            },
            properties: {
              class: `not-prose px-1 transition-opacity select-none
                group-target:opacity-100 focus:opacity-100 max-sm:hidden
                sm:absolute sm:-translate-x-full sm:opacity-0
                sm:group-hover:opacity-100`,
              "aria-label": "Link to this heading",
            },
            headingProperties: { class: "group relative text-balance" },
          }),
      ],
    }),
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "dark-plus",
      },
      transformers: [
        transformerLineNumbers(),
        transformerMetaDiff(),
        transformerMetaHighlight(),
        transformerCodeBlock(),
      ],
    },
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
    },
  },
  redirects: {
    "/blog/tailwind-css-tips": "/blog/tailwindcss-v3-tips",
  },
  integrations: [
    mdx({
      optimize: {
        ignoreElementNames: ["pre", "img"],
      },
    }),
    sitemap({
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
