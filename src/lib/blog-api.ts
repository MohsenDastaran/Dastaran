import { loadEnv } from "vite";
import { z } from "zod";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const BLOG_STATUSES = ["published", "under-review"] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

export const blogPostApiSchema = z.object({
  slug: z.string().min(1).regex(SLUG_PATTERN, "slug must be kebab-case"),
  title: z.string().min(1),
  description: z.string().min(1),
  body: z.string(),
  status: z.enum(BLOG_STATUSES).optional().default("published"),
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

const postResponseSchema = z.union([
  blogPostApiSchema,
  z.object({ post: blogPostApiSchema }),
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

export function getBlogApiToken() {
  return readEnv("BLOG_API_TOKEN");
}

function getBlogApiUrl() {
  return readEnv("BLOG_API_URL");
}

function postsUrl(baseUrl: string, slug?: string) {
  const base = `${baseUrl.replace(/\/$/, "")}/posts`;
  return slug ? `${base}/${encodeURIComponent(slug)}` : base;
}

function apiHeaders(hasJsonBody = false) {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (hasJsonBody) {
    headers["Content-Type"] = "application/json";
  }
  const token = getBlogApiToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
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
    if (parsed.data.status !== "published") {
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

function parsePostPayload(payload: unknown): BlogPostApi | null {
  const parsed = postResponseSchema.safeParse(payload);
  if (!parsed.success) {
    console.warn("Invalid blog post from API:", z.prettifyError(parsed.error));
    return null;
  }
  return "post" in parsed.data ? parsed.data.post : parsed.data;
}

async function loadBlogPosts(): Promise<Array<BlogPostApi>> {
  const apiUrl = getBlogApiUrl();
  if (!apiUrl) {
    console.warn(
      "BLOG_API_URL is not set; blog collection will be empty. Set it to load posts from the API.",
    );
    return [];
  }

  try {
    const response = await fetch(postsUrl(apiUrl), {
      headers: apiHeaders(),
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

/** Fetch one post by slug, including under-review posts. Returns null on 404. */
export async function fetchBlogPost(slug: string): Promise<BlogPostApi | null> {
  const apiUrl = getBlogApiUrl();
  if (!apiUrl) {
    return null;
  }

  try {
    const response = await fetch(postsUrl(apiUrl, slug), {
      headers: apiHeaders(),
      signal: AbortSignal.timeout(15_000),
    });
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      console.warn(
        `Blog API request for "${slug}" failed (${response.status} ${response.statusText}).`,
      );
      return null;
    }
    return parsePostPayload(await response.json());
  } catch (error) {
    console.warn(`Blog API request for "${slug}" failed.`, error);
    return null;
  }
}

export async function publishBlogPost(slug: string): Promise<boolean> {
  const apiUrl = getBlogApiUrl();
  if (!apiUrl) {
    return false;
  }

  const response = await fetch(postsUrl(apiUrl, slug), {
    method: "PATCH",
    headers: apiHeaders(true),
    body: JSON.stringify({ status: "published" }),
    signal: AbortSignal.timeout(15_000),
  });
  return response.ok;
}

export async function deleteBlogPost(slug: string): Promise<boolean> {
  const apiUrl = getBlogApiUrl();
  if (!apiUrl) {
    return false;
  }

  const response = await fetch(postsUrl(apiUrl, slug), {
    method: "DELETE",
    headers: apiHeaders(),
    signal: AbortSignal.timeout(15_000),
  });
  return response.ok;
}
