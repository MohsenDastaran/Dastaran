import { loadEnv } from "vite";
import { z } from "zod";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const blogPostApiSchema = z.object({
  slug: z.string().min(1).regex(SLUG_PATTERN, "slug must be kebab-case"),
  title: z.string().min(1),
  description: z.string().min(1),
  body: z.string(),
  draft: z.boolean().optional().default(false),
  publicationDate: z.coerce.date(),
  modificationDate: z.coerce.date().nullish(),
  cover: z.url().nullish(),
  tags: z.array(z.string().min(1)).optional(),
  showComments: z.boolean().optional().default(true),
  authors: z.array(z.string().min(1)).optional(),
});

export type BlogPostApi = z.infer<typeof blogPostApiSchema>;

const postsResponseSchema = z.union([
  z.array(z.unknown()),
  z.object({ posts: z.array(z.unknown()) }),
]);

function readEnv(name: string): string | undefined {
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

function postsUrl(baseUrl: string) {
  return `${baseUrl.replace(/\/$/, "")}/posts`;
}

function parsePostsPayload(payload: unknown): Array<BlogPostApi> {
  const envelope = postsResponseSchema.safeParse(payload);
  if (!envelope.success) {
    throw new Error("Blog API response must be an array or { posts: [...] }");
  }
  const rawPosts = Array.isArray(envelope.data)
    ? envelope.data
    : envelope.data.posts;

  const posts: Array<BlogPostApi> = [];
  const seen = new Set<string>();

  for (const item of rawPosts) {
    const parsed = blogPostApiSchema.safeParse(item);
    if (!parsed.success) {
      console.warn(
        "Skipping invalid blog post from API:",
        z.prettifyError(parsed.error),
      );
      continue;
    }
    if (seen.has(parsed.data.slug)) {
      console.warn(`Skipping duplicate blog slug "${parsed.data.slug}"`);
      continue;
    }
    seen.add(parsed.data.slug);
    posts.push(parsed.data);
  }

  return posts;
}

async function loadBlogPosts(): Promise<Array<BlogPostApi>> {
  const apiUrl = readEnv("BLOG_API_URL");
  if (!apiUrl) {
    console.warn(
      "BLOG_API_URL is not set; blog collection will be empty. Set it to load posts from the API.",
    );
    return [];
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  const token = readEnv("BLOG_API_TOKEN");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(postsUrl(apiUrl), {
      headers,
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      console.warn(
        `Blog API request failed (${response.status} ${response.statusText}); blog collection will be empty.`,
      );
      return [];
    }
    return parsePostsPayload(await response.json());
  } catch (error) {
    console.warn(
      "Blog API request failed; blog collection will be empty.",
      error,
    );
    return [];
  }
}

/**
 * Fetch published blog posts from the backend. Used by the content loader and
 * sitemap lastmod map. Returns an empty list when the API is unset or unreachable
 * so `astro build` still succeeds.
 */
export async function fetchBlogPosts(): Promise<Array<BlogPostApi>> {
  return loadBlogPosts();
}
