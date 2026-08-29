import type { APIRoute } from "astro";
import { LLMS_HEADERS, renderLlmsFullTxt } from "@/lib/llms";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const body = await renderLlmsFullTxt(url);
  return new Response(body, { headers: LLMS_HEADERS });
};
