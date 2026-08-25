import { rehypeHeadingIds } from "@astrojs/markdown-remark";
import type { RehypePlugins, ShikiConfig } from "@astrojs/markdown-remark";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import {
  transformerMetaDiff,
  transformerMetaHighlight,
} from "./shiki/transformerMeta";
import { transformerCodeBlock } from "./shiki/transformerCodeBlock";
import { transformerLineNumbers } from "./shiki/transformerLineNumbers";

export const blogRehypePlugins = [
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
] satisfies RehypePlugins;

export const blogShikiConfig = {
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
} satisfies ShikiConfig;
