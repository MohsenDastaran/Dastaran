import type { APIRoute } from "astro";
import {
  deleteBlogPost,
  updateBlogPost,
  blogPostPatchSchema,
} from "@/lib/blog-api";
import { isBlogAdmin } from "@/lib/blog-admin";

export const prerender = false;

export const PATCH: APIRoute = async ({ params, cookies, request }) => {
  if (!isBlogAdmin(cookies)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const slug = params.slug;
  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = blogPostPatchSchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const result = await updateBlogPost(slug, parsed.data);
    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: result.status === 401 ? 502 : result.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(null, { status: 204 });
  } catch {
    return new Response(JSON.stringify({ error: "Save failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  if (!isBlogAdmin(cookies)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const slug = params.slug;
  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  try {
    const didDelete = await deleteBlogPost(slug);
    if (!didDelete) {
      return new Response("Delete failed", { status: 502 });
    }
    return new Response(null, { status: 204 });
  } catch {
    return new Response("Delete failed", { status: 502 });
  }
};
