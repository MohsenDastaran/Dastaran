import type { APIRoute } from "astro";
import { submitContactToApi } from "@/lib/contact-api";
import { contactPayloadSchema } from "@/lib/definitions";

export const prerender = false;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const parsed = contactPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: "Invalid payload" }, 400);
  }

  if (parsed.data.company) {
    return json({ ok: true }, 200);
  }

  const { company: _honeypot, ...payload } = parsed.data;
  const result = await submitContactToApi(payload);
  if (!result.ok) {
    return json(
      { error: "Failed to send the message. Please try again later." },
      result.status === 429 ? 429 : 502,
    );
  }

  return json({ ok: true }, 200);
};
