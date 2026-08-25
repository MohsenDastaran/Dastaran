# Blog API

The Astro site loads **published** blog posts **at build time** from a backend HTTP API. Those posts are prerendered to `/blog/{slug}/`, which is what makes them appear on `/blog`, the sitemap, RSS feed, `llms.txt`, and Open Graph images.

Posts that are still **under review** are not built into the site. Admins preview them at `/blog/preview/{slug}/` (SSR, noindex, not linked from the navbar). Publishing from that page updates the backend; **rebuild and redeploy this site** so the public URL, sitemap, and RSS pick up the change.

If `BLOG_API_URL` is unset or the request fails, the build still succeeds with an empty blog (a warning is logged).

## Environment

Set these on the machine that runs `astro build` and the Node server (CI, Docker, or `.env` locally):

| Variable         | Required                     | Description                                                                        |
| ---------------- | ---------------------------- | ---------------------------------------------------------------------------------- |
| `BLOG_API_URL`   | For loading posts            | Base URL of the API, with no trailing `/posts`. Example: `https://api.example.com` |
| `BLOG_API_TOKEN` | Preview, publish, and delete | Sent as `Authorization: Bearer <token>`. Also unlocks `/blog/preview/{slug}/`.     |

## Status

Every post has exactly one status:

| Status         | Meaning                                         | Public site                                      |
| -------------- | ----------------------------------------------- | ------------------------------------------------ |
| `under-review` | Written, waiting for admin approval             | Hidden. Preview only at `/blog/preview/{slug}/`. |
| `published`    | Approved. `GET /posts` returns these by default | Built to `/blog/{slug}/` on the next site build. |

New posts should be created as `under-review`. The admin Publish button sets `status` to `published`.

## `GET /posts`

Returns **published posts only**. Do not require a query string for that filter - published is the default. Response body is either a JSON array or `{ "posts": [ ... ] }`.

The Astro build calls this with no extra params. Under-review posts must not appear in this list.

Each post object:

```json
{
  "slug": "how-to-do-something-useful",
  "title": "How to do something useful in React Router 7",
  "description": "Learn how to do X with Y for better Z.",
  "status": "published",
  "publicationDate": "2026-03-01T12:00:00Z",
  "modificationDate": null,
  "cover": "https://cdn.example.com/blog/how-to-do-something-useful/cover.webp",
  "tags": ["React Router 7", "SEO", "Tips and Tricks"],
  "showComments": true,
  "authors": ["MohsenDastaran"],
  "body": "I ran into this when I needed to generate a sitemap...\n\n## Install the package\n\n..."
}
```

### Fields

| Field              | Type                              | Notes                                                                                 |
| ------------------ | --------------------------------- | ------------------------------------------------------------------------------------- |
| `slug`             | string                            | Kebab-case. Becomes `/blog/{slug}/`. Must be unique.                                  |
| `title`            | string                            | Required                                                                              |
| `description`      | string                            | Required. Used in listings, RSS, and meta description.                                |
| `body`             | string                            | Markdown (see below). Not MDX.                                                        |
| `status`           | `"published"` \| `"under-review"` | Default for `GET /posts` is published-only. New posts: `under-review`.                |
| `publicationDate`  | ISO 8601 datetime                 | Required. Used for sorting, RSS `pubDate`, and JSON-LD.                               |
| `modificationDate` | ISO 8601 datetime or `null`       | When set, sitemap `lastmod` and "Last updated" use this instead of `publicationDate`. |
| `cover`            | absolute `https` URL or `null`    | Optional. CDN/storage URL. If omitted, the site generates `/blog/{slug}/og.png`.      |
| `tags`             | string array                      | Optional. Capitalize naturally (`"Tips and Tricks"`, `"SEO"`).                        |
| `showComments`     | boolean                           | Default `true`. Set `false` for personal / non-technical posts.                       |
| `authors`          | string array                      | Author ids from `src/data/authors.json`. Default `["MohsenDastaran"]`.                |

Invalid items in the array are skipped (with a warning). Duplicate slugs keep the first occurrence. Any `under-review` item that slips into this response is ignored.

## `GET /posts/:slug`

Required for the admin preview page. Return the same JSON object as one element of `GET /posts` (or `{ "post": { ... } }`), **including under-review posts**.

- Require `Authorization: Bearer <token>` (same as `BLOG_API_TOKEN`).
- `404` when the slug does not exist.

The public listing never calls this. The site uses it only at `/blog/preview/{slug}/`.

## `PATCH /posts/:slug`

Publish (or update) a post. The preview **Publish** button sends:

```json
{ "status": "published" }
```

Require bearer auth. Suggested responses: `200`/`204` on success, `404` if missing.

When publishing, set `publicationDate` if it was only a placeholder, and optionally `modificationDate`.

## `DELETE /posts/:slug`

Permanently delete the post. The preview **Delete** button calls this.

Require bearer auth. Suggested responses: `204` on success, `404` if missing.

## Admin preview

1. Create the post as `under-review`.
2. Open `https://www.dastaran.com/blog/preview/{slug}/?token=<BLOG_API_TOKEN>` once. The site stores an httpOnly cookie and redirects to the same path without the token in the URL.
3. Review the rendered post. Use **Publish** or **Delete**.
4. After publish, rebuild this Astro site so `/blog/{slug}/` exists for readers.

The preview route is SSR (`prerender = false`), sends `noindex`, is disallowed in `robots.txt`, is excluded from the sitemap, and is not linked from the navbar.

## Markdown rules

`body` is **Markdown**, rendered with the site's existing remark/rehype pipeline (Shiki, heading IDs, TOC).

- Do **not** put JSX imports or Astro/React components in `body` (`import Alert from ...`, `<Alert>`, `<ProfileBadge>`, etc.). Those only worked with local MDX files.
- Images must be **absolute URLs** (`https://cdn.example.com/...`), not relative paths.
- Links to other posts should be site-relative with a trailing slash: `[sitemap guide](/blog/sitemap-react-router-7/)`.
- Fenced code blocks can still use meta options: `filename="..."`, `showLineNumbers`, `highlight={6-8}`, `add={...}`, `remove={...}`.
- MDX without imports is valid Markdown, so existing writing style (headings, emphasis, lists) still works.

## Cover images

Host covers on a CDN or object storage and send the public HTTPS URL. The layout renders that URL as an `<img>`. Do not send a local filesystem path.

If `cover` is omitted, Open Graph and social previews use the generated `og.png` for that slug (published posts only).

## Auth

`GET /posts` can stay unauthenticated if published bodies are public anyway (the built HTML will contain them).

Protect `GET /posts/:slug` (when it can return under-review posts), `PATCH`, and `DELETE` with `Authorization: Bearer <token>`. Set the same value as `BLOG_API_TOKEN` on this site.

## Deploy

1. Create the post as `under-review` and preview it.
2. Publish from `/blog/preview/{slug}/` (or set `status: "published"` in the backend).
3. Rebuild this Astro site (`bun run build` / CI) and deploy.

Until step 3, `/blog/{slug}/`, `sitemap-index.xml`, `rss.xml`, and `llms.txt` still show the previous snapshot. `/blog` only lists posts from the last build's `GET /posts`.

## Backend stack

Any HTTP server that can return the JSON above is fine: Node, Laravel, Strapi, Directus, a custom CMS, etc. The site does not depend on a particular framework.

Keep Markdown in the database (or files behind the API) as a string field named `body`. Store covers in object storage and persist the public URL.
