import { generateOG } from "@/lib/og/generate-og";
import type { APIRoute } from "astro";
import { fetchPublishedBlogPost } from "@/lib/blog-api";

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
  const slugParam = params.slug;
  const slug = Array.isArray(slugParam) ? slugParam.join("/") : slugParam;
  if (!slug) {
    return new Response(null, { status: 404 });
  }

  const post = await fetchPublishedBlogPost(slug);
  if (!post || post.cover) {
    return new Response(null, { status: 404 });
  }

  return generateOG({
    title: post.title,
    description: post.description,
    origin: url.origin,
  });
};
