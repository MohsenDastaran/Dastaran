import { z } from "zod";
import { apiUrl, getBlogApiToken } from "./api";

export { getBlogApiToken };

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const BLOG_STATUSES = ["published", "under-review"] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

function optionalHttpsUrl(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return value;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function optionalBoolean(value: unknown) {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (value === 1 || value === "1" || value === "true") {
    return true;
  }
  if (value === 0 || value === "0" || value === "false") {
    return false;
  }
  return undefined;
}

function optionalStringArray(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  let items: Array<unknown> | undefined;
  if (Array.isArray(value)) {
    items = value;
  } else if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      items = Array.isArray(parsed) ? parsed : undefined;
    } catch {
      items = value.split(",");
    }
  }
  if (!items) {
    return undefined;
  }
  const strings = items
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return strings.length > 0 ? strings : undefined;
}

const DEFAULT_AUTHOR_ID = "MohsenDastaran";
const KNOWN_AUTHOR_IDS = new Set([DEFAULT_AUTHOR_ID]);

export function resolveAuthorIds(authors?: Array<string>) {
  const ids = (authors ?? []).filter((id) => KNOWN_AUTHOR_IDS.has(id));
  return ids.length > 0 ? ids : [DEFAULT_AUTHOR_ID];
}

export const blogPostApiSchema = z.object({
  slug: z
    .string()
    .min(1)
    .transform((value) => value.trim())
    .refine((value) => SLUG_PATTERN.test(value), "slug must be kebab-case"),
  title: z.string().min(1),
  description: z.string().optional().default(""),
  body: z.preprocess((value) => (value == null ? "" : value), z.string()),
  status: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
    z.enum(BLOG_STATUSES).optional().default("published"),
  ),
  publicationDate: z.coerce.date(),
  modificationDate: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.date().optional(),
  ),
  cover: z.preprocess(optionalHttpsUrl, z.string().optional()),
  tags: z.preprocess(
    optionalStringArray,
    z.array(z.string().min(1)).optional(),
  ),
  showComments: z
    .preprocess(optionalBoolean, z.boolean().optional())
    .default(true),
  authors: z.preprocess(
    optionalStringArray,
    z.array(z.string().min(1)).optional(),
  ),
});

export type BlogPostApi = z.infer<typeof blogPostApiSchema>;

export const blogPostPatchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  body: z.string().optional(),
  cover: z.union([z.string(), z.null()]).optional(),
  tags: z.array(z.string().min(1)).optional(),
  showComments: z.boolean().optional(),
  authors: z.array(z.string().min(1)).optional(),
  status: z.enum(BLOG_STATUSES).optional(),
  publicationDate: z.string().optional(),
  modificationDate: z.string().optional(),
});

export type BlogPostPatch = z.infer<typeof blogPostPatchSchema>;

const postsResponseSchema = z.union([
  z.array(z.unknown()),
  z.object({ posts: z.array(z.unknown()) }),
]);

const postResponseSchema = z.union([
  blogPostApiSchema,
  z.object({ post: blogPostApiSchema }),
]);

function postsUrl(slug?: string) {
  return slug ? apiUrl(`/posts/${encodeURIComponent(slug)}`) : apiUrl("/posts");
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

export function parsePostsPayload(payload: unknown): Array<BlogPostApi> {
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
  if (!getBlogApiToken()) {
    console.warn(
      "BLOG_API_TOKEN is not set. This API returns an empty GET /posts and 401 for GET /posts/:slug without a bearer token.",
    );
  }
  try {
    const response = await fetch(postsUrl(), {
      headers: apiHeaders(),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      console.warn(
        `Blog API request failed (${response.status} ${response.statusText}); blog collection will be empty.`,
      );
      if (response.status === 401 && !getBlogApiToken()) {
        console.warn(
          "BLOG_API_TOKEN is not set. GET /posts is empty without auth and GET /posts/:slug returns 401.",
        );
      }
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
 * sitemap lastmod map. Returns an empty list when the API is unreachable
 * so `astro build` still succeeds.
 */
export async function fetchBlogPosts(): Promise<Array<BlogPostApi>> {
  return loadBlogPosts();
}

/**
 * Published post for a public URL. Uses `GET /posts` first so the page still
 * works when `GET /posts/{slug}` is auth-only (preview/admin).
 */
export async function fetchPublishedBlogPost(
  slug: string,
): Promise<BlogPostApi | null> {
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    decoded = slug;
  }
  const fromList = (await fetchBlogPosts()).find(
    (post) => post.slug === decoded || post.slug === slug,
  );
  if (fromList) {
    return fromList;
  }
  const bySlug = await fetchBlogPost(decoded);
  if (!bySlug || bySlug.status === "under-review") {
    return null;
  }
  return bySlug;
}

/** Fetch one post by slug, including under-review posts. Returns null on 404. */
export async function fetchBlogPost(slug: string): Promise<BlogPostApi | null> {
  try {
    const response = await fetch(postsUrl(slug), {
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

export async function updateBlogPost(
  slug: string,
  patch: BlogPostPatch,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const response = await fetch(postsUrl(slug), {
    method: "PATCH",
    headers: apiHeaders(true),
    body: JSON.stringify(patch),
    signal: AbortSignal.timeout(15_000),
  });
  if (response.ok) {
    return { ok: true };
  }
  let error = `Save failed (${response.status})`;
  try {
    const payload: unknown = await response.json();
    if (
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
    ) {
      error = payload.error;
    }
  } catch {
    // Keep the status text fallback.
  }
  return { ok: false, status: response.status, error };
}

export async function publishBlogPost(slug: string): Promise<boolean> {
  const response = await fetch(postsUrl(slug), {
    method: "PATCH",
    headers: apiHeaders(true),
    body: JSON.stringify({ status: "published" }),
    signal: AbortSignal.timeout(15_000),
  });
  return response.ok;
}

export async function deleteBlogPost(slug: string): Promise<boolean> {
  const response = await fetch(postsUrl(slug), {
    method: "DELETE",
    headers: apiHeaders(),
    signal: AbortSignal.timeout(15_000),
  });
  return response.ok;
}
