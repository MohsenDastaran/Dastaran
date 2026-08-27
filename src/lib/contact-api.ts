import { apiUrl } from "./api";
import type { ContactPayload } from "./definitions";

export type ContactApiBody = Omit<ContactPayload, "company">;

export type SubmitContactResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function submitContactToApi(
  payload: ContactApiBody,
): Promise<SubmitContactResult> {
  let response: Response;
  try {
    response = await fetch(apiUrl("/contact"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, status: 502, error: "Contact API unreachable" };
  }

  if (response.ok) {
    return { ok: true };
  }

  return {
    ok: false,
    status: response.status,
    error: "Failed to send the message",
  };
}
