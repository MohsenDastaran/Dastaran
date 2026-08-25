import type { APIRoute } from "astro";
import { deleteBlogPost } from "@/lib/blog-api";
import { isBlogAdmin } from "@/lib/blog-admin";

export const prerender = false;

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
