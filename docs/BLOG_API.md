# Blog API

The Astro site loads blog posts **at build time** from a backend HTTP API. Posts are prerendered to `/blog/{slug}/`, which is what makes them appear in the sitemap, RSS feed, `llms.txt`, and Open Graph images.

Publishing or updating a post on the backend is not enough on its own. **Rebuild and redeploy this site** so static pages and SEO files pick up the change.

If `BLOG_API_URL` is unset or the request fails, the build still succeeds with an empty blog (a warning is logged).

## Environment

Set these on the machine that runs `astro build` (CI, Docker, or `.env` locally):

| Variable         | Required          | Description                                                                        |
| ---------------- | ----------------- | ---------------------------------------------------------------------------------- |
| `BLOG_API_URL`   | For loading posts | Base URL of the API, with no trailing `/posts`. Example: `https://api.example.com` |
| `BLOG_API_TOKEN` | No                | If set, sent as `Authorization: Bearer <token>`                                    |

The site only calls `GET {BLOG_API_URL}/posts`. It does not call the optional single-post endpoint below.

## `GET /posts`

Returns every post the site should consider (including drafts). Response body is either a JSON array or `{ "posts": [ ... ] }`.

Each post object:

```json
{
  "slug": "how-to-do-something-useful",
  "title": "How to do something useful in React Router 7",
  "description": "Learn how to do X with Y for better Z.",
  "draft": false,
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

| Field              | Type                           | Notes                                                                                 |
| ------------------ | ------------------------------ | ------------------------------------------------------------------------------------- |
| `slug`             | string                         | Kebab-case. Becomes `/blog/{slug}/`. Must be unique.                                  |
| `title`            | string                         | Required                                                                              |
| `description`      | string                         | Required. Used in listings, RSS, and meta description.                                |
| `body`             | string                         | Markdown (see below). Not MDX.                                                        |
| `draft`            | boolean                        | Default `false`. `true` hides the post in production builds.                          |
| `publicationDate`  | ISO 8601 datetime              | Required. Used for sorting, RSS `pubDate`, and JSON-LD.                               |
| `modificationDate` | ISO 8601 datetime or `null`    | When set, sitemap `lastmod` and "Last updated" use this instead of `publicationDate`. |
| `cover`            | absolute `https` URL or `null` | Optional. CDN/storage URL. If omitted, the site generates `/blog/{slug}/og.png`.      |
| `tags`             | string array                   | Optional. Capitalize naturally (`"Tips and Tricks"`, `"SEO"`).                        |
| `showComments`     | boolean                        | Default `true`. Set `false` for personal / non-technical posts.                       |
| `authors`          | string array                   | Author ids from `src/data/authors.json`. Default `["MohsenDastaran"]`.                |

Invalid items in the array are skipped (with a warning). Duplicate slugs keep the first occurrence.

## `GET /posts/:slug` (optional)

The frontend does not use this. A single-post endpoint is still useful for a CMS preview, admin UI, or other clients. Return the same JSON object as one element of `GET /posts`.

Suggested response: `404` when the slug does not exist.

## Markdown rules

`body` is **Markdown**, rendered with the site's existing remark/rehype pipeline (Shiki, heading IDs, TOC).

- Do **not** put JSX imports or Astro/React components in `body` (`import Alert from ...`, `<Alert>`, `<ProfileBadge>`, etc.). Those only worked with local MDX files.
- Images must be **absolute URLs** (`https://cdn.example.com/...`), not relative paths.
- Links to other posts should be site-relative with a trailing slash: `[sitemap guide](/blog/sitemap-react-router-7/)`.
- Fenced code blocks can still use meta options: `filename="..."`, `showLineNumbers`, `highlight={6-8}`, `add={...}`, `remove={...}`.
- MDX without imports is valid Markdown, so existing writing style (headings, emphasis, lists) still works.

## Drafts

`draft: true` posts are loaded into the content collection but **hidden in production** (`astro build` with `PROD`). They still show locally in `astro dev` so you can preview.

## Cover images

Host covers on a CDN or object storage and send the public HTTPS URL. The layout renders that URL as an `<img>`. Do not send a local filesystem path.

If `cover` is omitted, Open Graph and social previews use the generated `og.png` for that slug.

## Auth

Unauthenticated `GET /posts` is fine if the payload is public anyway (the built HTML will contain the posts).

If the API should not be world-readable, set `BLOG_API_TOKEN` on the build environment and require `Authorization: Bearer <token>` on the backend.

## Deploy

1. Create or update the post in the backend.
2. Rebuild this Astro site (`bun run build` / CI).
3. Deploy the new build.

Until step 2–3, `/blog/{slug}/`, `sitemap-index.xml`, `rss.xml`, and `llms.txt` still show the previous snapshot.

## Backend stack

Any HTTP server that can return the JSON above is fine: Node, Laravel, Strapi, Directus, a custom CMS, etc. The site does not depend on a particular framework.

Keep Markdown in the database (or files behind the API) as a string field named `body`. Store covers in object storage and persist the public URL.
