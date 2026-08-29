import type { APIRoute } from "astro";
import { getSiteOrigin, pageUrl } from "@/lib/site";

export const prerender = false;

const AI_USER_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

const getRobotsTxt = (origin: string) => {
  const aiRules = AI_USER_AGENTS.map(
    (agent) => `User-agent: ${agent}\nAllow: /\nDisallow: /blog/preview/`,
  ).join("\n\n");

  return `\
User-agent: *
Allow: /
Disallow: /blog/preview/

${aiRules}

Sitemap: ${pageUrl("/sitemap-index.xml", origin)}
Sitemap: ${pageUrl("/sitemap.xml", origin)}

# Curated entry points for LLMs and AI search
# ${pageUrl("/llms.txt", origin)}
# ${pageUrl("/llms-full.txt", origin)}
`;
};

export const GET: APIRoute = ({ url }) =>
  new Response(getRobotsTxt(getSiteOrigin(url)), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
