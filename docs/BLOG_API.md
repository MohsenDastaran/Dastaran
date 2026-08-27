# Blog API

The Astro site loads **published** blog posts from `GET {API_BASE_URL}/posts`. `/blog/` and `/blog/{slug}/` are SSR and fetch that list at **request time**, so new published posts show up without a rebuild.

The sitemap, RSS feed, and `llms.txt` are still generated at **build time**. Rebuild after publishing if you want those to update.

Posts that are still **under review** stay off the public site. Admins preview them at `/blog/preview/{slug}/` (SSR, noindex, not linked from the navbar).

If the API request fails, the build still succeeds and the public blog renders empty (a warning is logged).

This site does **not** expose `/posts`. That route lives on the blog API host. A 404 for `/posts` on `dastaran.com` is expected.

## Environment

Set these on the machine that runs `astro build` and the Node server (CI, Docker, or `.env` locally):

| Variable       | Required | Description                                                                                                       |
| -------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `API_BASE_URL` | No       | API host only (no resource path). Defaults to `https://api.dastaran.com/`. Blog posts are `{API_BASE_URL}/posts`. |

`BLOG_API_URL` is still read if `API_BASE_URL` is unset, so existing Coolify env vars keep working.
| `BLOG_API_TOKEN` | Yes, for this API | Bearer token. `GET /posts` is empty and `GET /posts/:slug` is 401 without it. Also unlocks preview/publish/delete. |

## Status

Every post has exactly one status:

| Status         | Meaning                                         | Public site                                       |
| -------------- | ----------------------------------------------- | ------------------------------------------------- |
| `under-review` | Written, waiting for admin approval             | Hidden. Preview only at `/blog/preview/{slug}/`.  |
| `published`    | Approved. `GET /posts` returns these by default | Listed on `/blog/` and served at `/blog/{slug}/`. |

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

Public `/blog/{slug}/` pages use `GET /posts` and match the slug. They do not need this endpoint. The site uses `GET /posts/:slug` only at `/blog/preview/{slug}/`.

## `PATCH /posts/:slug`

Update fields or publish. Require bearer auth. `200` with the post, or `204`. `400` invalid payload, `401` missing token, `404` missing slug.

The preview **Edit** button sends the current title, description, Markdown `body`, cover, tags, `showComments`, and `modificationDate`. It does not change `status`. Empty cover is sent as `null`.

The preview **Publish** button sends:

```json
{ "status": "published" }
```

## `DELETE /posts/:slug`

Permanently delete the post. The preview **Delete** button calls this.

Require bearer auth. Suggested responses: `204` on success, `404` if missing.

## Admin preview

1. Create the post as `under-review`.
2. Open `https://www.dastaran.com/blog/preview/{slug}/?token=<BLOG_API_TOKEN>` once. The site stores an httpOnly cookie and redirects to the same path without the token in the URL.
3. Review the rendered post. Use **Edit**, **Publish**, or **Delete**.
4. After publish, `/blog/{slug}/` is available immediately. Rebuild if you also want sitemap, RSS, and `llms.txt` updated.

The preview route is SSR (`prerender = false`), sends `noindex`, is disallowed in `robots.txt`, is excluded from the sitemap, and is not linked from the navbar.

## Markdown rules

`body` is **Markdown**, rendered with the site's existing remark/rehype pipeline (Shiki, heading IDs, TOC).

- Do **not** put JSX, MDX, or Astro/React components in `body`. Callouts can be blockquotes (`> **Tip:** ...`).
- Images must be **absolute URLs** (`https://cdn.example.com/...`), not relative paths.
- Links to other posts should be site-relative with a trailing slash: `[sitemap guide](/blog/sitemap-react-router-7/)`.
- Fenced code blocks can still use meta options: `filename="..."`, `showLineNumbers`, `highlight={6-8}`, `add={...}`, `remove={...}`.

## Cover images

Host covers on a CDN or object storage and send the public HTTPS URL. The layout renders that URL as an `<img>`. Do not send a local filesystem path.

If `cover` is omitted, Open Graph and social previews use the generated `og.png` for that slug (published posts only).

## Auth

`GET /posts` can stay unauthenticated if published bodies are public anyway (the built HTML will contain them).

Protect `GET /posts/:slug` (when it can return under-review posts), `PATCH`, and `DELETE` with `Authorization: Bearer <token>`. Set the same value as `BLOG_API_TOKEN` on this site.

## Deploy

This is a **Node** app (`@astrojs/node` standalone), not a static site. `/blog/` is SSR (`prerender = false`). If Coolify (or nginx) serves `dist/client` as static files, `/blog/` and `/blog/{slug}/` return **404** because those HTML files are not generated.

Coolify:

1. Disable "Static site" / nginx SPA. Use Nixpacks or a Dockerfile that runs Node.
2. Build command: `bun run build` (or `npm run build`).
3. Start command: `node ./dist/server/entry.mjs` (`package.json` `start` script).
4. Port **4321**, `HOST=0.0.0.0`, `PORT=4321`.
5. `API_BASE_URL` is the API host and defaults to `https://api.dastaran.com/`. Override it as a **runtime** env var if needed. Set `BLOG_API_TOKEN` for preview/publish/delete.

Publishing a post:

1. Create the post as `under-review` and preview it.
2. Publish from `/blog/preview/{slug}/` (or set `status: "published"` in the backend).
3. Public listing and post pages pick it up on the next request. Rebuild for sitemap, RSS, and `llms.txt`.

## Backend stack

Any HTTP server that can return the JSON above is fine: Node, Laravel, Strapi, Directus, a custom CMS, etc. The site does not depend on a particular framework.

Keep Markdown in the database (or files behind the API) as a string field named `body`. Store covers in object storage and persist the public URL.
