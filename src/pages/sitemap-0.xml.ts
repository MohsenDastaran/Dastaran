import type { APIRoute } from "astro";
import { sitemapResponse } from "@/lib/sitemap";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => sitemapResponse(url);
