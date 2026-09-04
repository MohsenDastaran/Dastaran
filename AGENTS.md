# AGENTS.md

Company portfolio website (https://www.dastaran.com/) built with Astro 7, React 19, TypeScript, and Tailwind CSS v4. Features a blog loaded from a backend API at build time, an AI chatbot (Vercel AI SDK + AI Gateway), contact form (Resend), and view counting (Drizzle + Turso/libSQL).

## Commands

- **Dev server:** `pnpm dev` (opens browser, exposes on network)
- **Build:** `pnpm build`
- **Preview:** `pnpm preview` (uses dotenv for env vars, Node adapter)
- **Lint:** `pnpm lint` (ESLint for ts/tsx/astro files)
- **Format:** `pnpm format` (Prettier with Astro, Tailwind, classnames plugins)
- **Test:** `pnpm test` (Vitest, runs in watch mode)
- **Unused deps:** `pnpm knip`

## Architecture

### Content System

Content collections defined in `src/content.config.ts` with Zod schemas:

- **blog** — Published Markdown posts from `GET {API_BASE_URL}/posts`. `/blog/` and `/blog/{slug}/` fetch at request time; the content loader still runs at build for sitemap/RSS. Under-review posts are previewed at `/blog/preview/{slug}/`. See [docs/BLOG_API.md](./docs/BLOG_API.md). Do not create files under `src/content/blog/`.
- **authors** — JSON file at `src/data/authors.json`, referenced by blog posts
- **career** — JSON file at `src/data/career.json` (work/education entries)
- **projects** — JSON file at `src/data/projects.json`

### Layouts & Pages

- `src/layouts/RootLayout.astro` — Base layout (navbar, footer, SEO head)
- `src/layouts/BlogPost.astro` — Blog post wrapper (metadata, TOC, reading time, view count, comments)
- Pages in `src/pages/` follow Astro file-based routing
- API endpoints: `src/pages/api/chat/` (AI chat), `src/pages/api/blog/` (admin patch/delete)

### Components

- `src/components/*.astro` — Static Astro components
- `src/components/react/` — Interactive React components (forms, chat, image zoom)
- `src/components/react/ui/` — shadcn/ui components (new-york style, neutral base color)
- `src/components/react/chat/` — AI chatbot UI components

### Key Utilities

- `src/lib/utils.ts` — `cn()` for Tailwind class merging, `slugify()`
- `src/lib/api.ts` — Shared API host (`API_BASE_URL`, default `https://api.dastaran.com/`)
- `src/lib/blog-api.ts` — Fetch and Zod-parse blog posts from `{API_BASE_URL}/posts`
- `src/lib/posts.ts` — Blog collection queries, TOC generation
- `src/lib/shiki/` — Custom Shiki transformers for code blocks (line numbers, diff highlighting, meta highlights, file icons)
- `src/lib/og/` — Open Graph image generation
- `src/data/` — Static data (skills, navigation, socials, career, projects, authors)

### Database

Drizzle ORM + libSQL (Turso in production, local file in dev) with a `ViewCount` table in `src/db/schema.ts`.

## Code Style

- Path alias: `@/*` maps to `./src/*`
- Use `type` keyword for TypeScript type definitions (not `interface`)
- Use `Array<T>` generic syntax (not `T[]`)
- Derive types from their source of truth instead of hand-writing a duplicate that can be inferred - e.g. `z.infer<typeof schema>` from a Zod schema, `Awaited<ReturnType<…>>` from a function, or a tool's inferred output (`ChatTools["searchPosts"]["output"]`). A manually retyped shape silently drifts when the source changes.
- Boolean props must start with `is`, `has`, `show`, or `as`
- Self-closing components and HTML elements enforced
- Strict equality (`===`) required, curly braces required for all blocks
- `no-console` warns (except `warn`, `error`, `info`)
- Prettier: double quotes, semicolons, 2-space indent

## Writing Blog Posts

Posts live in the backend, not in this repo. The site fetches Markdown `body` strings at build time. Do **not** recreate `src/content/blog/` or add local `.mdx` files.

Full API contract, env vars, and deploy notes: [docs/BLOG_API.md](./docs/BLOG_API.md).

### Payload

Draft the post as JSON matching `GET /posts` (plus a Markdown `body`):

```json
{
  "slug": "how-to-do-something-useful",
  "title": "How to do something useful in React Router 7",
  "description": "Learn how to do X with Y for better Z.",
  "publicationDate": "2026-03-01T12:00:00Z",
  "tags": ["React Router 7", "SEO", "Tips and Tricks"],
  "cover": "https://cdn.example.com/blog/how-to-do-something-useful/cover.webp",
  "status": "under-review",
  "body": "I ran into this when...\n"
}
```

- `status: "under-review"` until the admin publishes from `/blog/preview/{slug}/`
- `status: "published"` after approval (`GET /posts` returns published posts only)
- `modificationDate` when updating an existing post
- `showComments: false` only for non-technical or personal posts
- Tags are capitalized naturally (e.g. "React Router 7", "Tips and Tricks", "SEO")
- Cover and inline images must be absolute `https` URLs
- `body` is Markdown only - no JSX imports or Astro components

After publish, rebuild the Astro site so `/blog/{slug}/`, the sitemap, and RSS update.

### Writing Style

The tone is conversational and direct - first person, as if explaining something to a fellow developer. Not overly formal, not overly casual. Sentences are concise but not robotic.

Key patterns:

- Open with a relatable problem or context, not a textbook definition
- Use "I" naturally (e.g. "I ran into this when...", "Here's how I set it up")
- Use "you" to address the reader directly (e.g. "You can now use this function")
- Contractions are fine and preferred (don't, isn't, you're, it's, that's)
- Keep paragraphs short - often 1-3 sentences
- Use `-` (hyphen/minus) for dashes, never `—` (em dash)
- Emphasis with `_**bold italic**_` for key takeaways (e.g. _**a single spam email**_)
- Italics with `_word_` for introducing terms or field names (e.g. _"company"_)
- Link to external resources generously, especially MDN, official docs, and GitHub repos
- Reference your own related posts with relative links, always with a trailing slash to match the canonical URL (e.g. `[sitemap generation guide](/blog/sitemap-react-router-7/)`)

### Structure

- `h2` (`##`) for main sections, `h3` (`###`) for subsections - these populate the table of contents
- Start with a brief intro (no heading) that sets context and motivation
- End naturally, often with a short closing thought or invitation for feedback - not a heavy "conclusion" section

### Markdown

No JSX imports. Callouts can be blockquotes (`> **Tip:** ...`). Code fences still support:

- `filename="path/to/file.ts"` - shows a file name header
- `showLineNumbers` - enables line numbers
- `showLineNumbers=8` - starts numbering at line 8
- `highlight={6-8}` or `{1,3}` - highlights specific lines
- `add={8-12}` / `remove={3-5}` - diff-style green/red highlighting
- Language after triple backticks (e.g. ` ```tsx `, ` ```bash `, ` ```json `)

## Adapter

Node adapter (`@astrojs/node`, standalone mode) in `astro.config.ts`.
