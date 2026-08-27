# Contact API

The homepage contact form does **not** send email from this Astro app. The browser posts to `POST /api/contact` on this site, which forwards JSON to `{API_BASE_URL}/contact`.

Implement that route on the backend (`https://api.dastaran.com/` by default). Until it exists, submit shows an error.

This site does **not** call Resend. Send the mail (or store the inquiry) in the backend.

## Flow

1. Visitor submits the form on `https://www.dastaran.com/`.
2. The React island `POST`s JSON to `https://www.dastaran.com/api/contact`.
3. Astro validates the payload and drops honeypot spam (`company` filled in).
4. Astro `POST`s the same JSON (without `company`) to `{API_BASE_URL}/contact`.
5. The backend emails you (Resend, SMTP, etc.) and returns `2xx`.

The browser never talks to `api.dastaran.com` directly, so CORS is not required for this form.

## Environment

Same host as the blog API. Set on the Astro server (Coolify runtime env):

| Variable       | Required | Description                                                                                  |
| -------------- | -------- | -------------------------------------------------------------------------------------------- |
| `API_BASE_URL` | No       | API host only. Defaults to `https://api.dastaran.com/`. Contact is `{API_BASE_URL}/contact`. |

No contact-specific secret is needed on this site. Do not put a Resend key on the frontend.

## `POST /contact`

Public. Do **not** require `BLOG_API_TOKEN`. Rate-limit by IP.

```http
POST /contact
Content-Type: application/json
```

```json
{
  "email": "jane@example.com",
  "name": "Jane Doe",
  "subject": "Project inquiry",
  "phone": "+49 123 456789",
  "message": "Hi, I would like to talk about a dashboard for our team."
}
```

### Fields

| Field     | Type   | Required | Notes                                                |
| --------- | ------ | -------- | ---------------------------------------------------- |
| `email`   | string | Yes      | Valid email. Use as `Reply-To`.                      |
| `name`    | string | No       | Omit or skip if empty. Min 2 chars when present.     |
| `subject` | string | No       | Min 2, max 50 when present. Fallback: `New inquiry`. |
| `phone`   | string | No       | Free-form phone. Omit if empty.                      |
| `message` | string | Yes      | Min 10, max 500 characters.                          |

The site never forwards `company`. If you also accept it, treat a non-empty value as a bot and return `200` without sending mail.

### Responses

| Status            | When                                                     |
| ----------------- | -------------------------------------------------------- |
| `200`/`201`/`204` | Mail queued or stored. Body optional (`{ "ok": true }`). |
| `400`             | Invalid JSON or fields.                                  |
| `429`             | Rate limited. The form shows a generic retry message.    |
| `500`/`502`       | Send failed.                                             |

Any `2xx` is success. The frontend does not read a response body.

## Suggested email

- **To:** `mohsen.dastaran@gmail.com` (or your inbox)
- **From:** a domain you control, e.g. `contact-form@dastaran.com`
- **Reply-To:** the visitor `email`
- **Subject:** payload `subject`, or `New inquiry`

Body can be HTML or text with name, phone, and message. Escape HTML if you interpolate the fields.

## Spam

The form includes a hidden `company` field. Astro returns success and does not call this endpoint when that field is set.

Still rate-limit `POST /contact` (for example 5 requests / 10 minutes / IP). Optional: reject disposable emails, or require a short cooldown.

## Deploy

1. Add `POST /contact` on the API host.
2. Send mail from the API (Resend API key, SMTP, etc. live **only** on the backend).
3. Confirm Astro has `API_BASE_URL` if it is not the default host.
4. Submit the homepage form. Network tab: `POST /api/contact` → `200`. API logs: `POST /contact`.
