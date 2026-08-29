import { SITE_DESCRIPTION, SITE_TITLE } from "@/consts";
import { getPosts } from "./posts";
import { getSiteOrigin, pageUrl } from "./site";

export const LLMS_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "public, max-age=3600",
} as const;

async function loadLlmsContext(requestUrl?: URL) {
  const origin = getSiteOrigin(requestUrl);
  const posts = await getPosts();
  return { origin, posts };
}

export async function renderLlmsTxt(requestUrl?: URL) {
  const { origin, posts } = await loadLlmsContext(requestUrl);

  const postLines = posts
    .map(({ data, id }) => {
      const postUrl = pageUrl(`/blog/${id}/`, origin);
      return `- [${data.title}](${postUrl}): ${data.description}`;
    })
    .join("\n");

  return `# ${SITE_TITLE}

> ${SITE_DESCRIPTION}

Personal portfolio and technical blog by Dastaran, a full stack developer. The blog covers web development with a focus on Astro, React, TypeScript, and Tailwind CSS.

For the full text of every published post, see [llms-full.txt](${pageUrl("/llms-full.txt", origin)}).

## Blog posts

${postLines || "- No published posts yet."}

## Key pages

- [Home](${pageUrl("/", origin)}): Projects, skills, and contact
- [Blog](${pageUrl("/blog/", origin)}): All articles
- [RSS feed](${pageUrl("/rss.xml", origin)}): Full-text feed of new posts
- [Privacy Policy](${pageUrl("/privacy-policy/", origin)})
- [Legal Notice](${pageUrl("/legal-notice/", origin)})
`;
}

export async function renderLlmsFullTxt(requestUrl?: URL) {
  const { origin, posts } = await loadLlmsContext(requestUrl);

  const postBlocks = posts
    .map(({ data, id, body }) => {
      const postUrl = pageUrl(`/blog/${id}/`, origin);
      const markdown = body?.trim() || data.description;
      return `## ${data.title}

- URL: ${postUrl}
- Published: ${data.publicationDate.toISOString()}

${markdown}
`;
    })
    .join("\n---\n\n");

  return `# ${SITE_TITLE}

> ${SITE_DESCRIPTION}

Full Markdown of every published post, plus the site index. For a short link list see [llms.txt](${pageUrl("/llms.txt", origin)}).

## Key pages

- [Home](${pageUrl("/", origin)}): Projects, skills, and contact
- [Blog](${pageUrl("/blog/", origin)}): All articles
- [RSS feed](${pageUrl("/rss.xml", origin)}): Full-text feed of new posts

## Blog posts

${postBlocks || "No published posts yet."}
`;
}
