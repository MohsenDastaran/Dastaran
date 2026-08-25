import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import type {
  MarkdownHeading,
  MarkdownRenderer,
} from "@astrojs/markdown-remark";
import { blogRehypePlugins, blogShikiConfig } from "./markdown-config";

let renderer: MarkdownRenderer | undefined;

async function getRenderer() {
  renderer ??= await createMarkdownProcessor({
    shikiConfig: blogShikiConfig,
    rehypePlugins: blogRehypePlugins,
  });
  return renderer;
}

export async function renderBlogMarkdown(body: string): Promise<{
  html: string;
  headings: Array<MarkdownHeading>;
}> {
  const result = await (await getRenderer()).render(body);
  return {
    html: result.code,
    headings: result.metadata.headings,
  };
}
