import { defineCollection, reference } from "astro:content";
import { file } from "astro/loaders";
import type { Loader } from "astro/loaders";
import { z } from "astro/zod";
import { fetchBlogPosts } from "./lib/blog-api";

const DEFAULT_AUTHOR_ID = "MohsenDastaran";

const blogLoader: Loader = {
  name: "blog-api",
  async load({ store, parseData, renderMarkdown, logger }) {
    store.clear();
    const posts = await fetchBlogPosts();

    for (const post of posts) {
      const authorIds = post.authors?.length
        ? post.authors
        : [DEFAULT_AUTHOR_ID];
      const data = await parseData({
        id: post.slug,
        data: {
          title: post.title,
          description: post.description,
          draft: post.draft,
          publicationDate: post.publicationDate,
          modificationDate: post.modificationDate ?? undefined,
          cover: post.cover ?? undefined,
          tags: post.tags,
          showComments: post.showComments,
          authors: authorIds,
        },
      });
      const rendered = await renderMarkdown(post.body);
      store.set({
        id: post.slug,
        data,
        body: post.body,
        rendered,
      });
    }

    logger.info(`Loaded ${String(posts.length)} blog post(s) from API`);
  },
};

const blog = defineCollection({
  loader: blogLoader,
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      draft: z.boolean().default(false),
      publicationDate: z.coerce.date(),
      modificationDate: z.coerce.date().optional(),
      cover: z.url().optional(),
      tags: z.array(z.string().min(1)).optional(),
      showComments: z.boolean().default(true),
      authors: z
        .array(reference("authors"))
        .default([{ collection: "authors", id: DEFAULT_AUTHOR_ID }]),
    })
    .strict(),
});

const authors = defineCollection({
  loader: file("src/data/authors.json"),
  schema: ({ image }) =>
    z
      .object({
        name: z.string(),
        image: image().optional(),
        email: z.email().optional(),
        x: z
          .url()
          .refine((arg) => arg.includes("x.com"), {
            message: "URL must contain x.com",
          })
          .optional(),
        github: z
          .url()
          .refine((arg) => arg.includes("github.com"), {
            message: "URL must contain github.com",
          })
          .optional(),
        linkedin: z
          .url()
          .refine((arg) => arg.includes("linkedin.com"), {
            message: "URL must contain linkedin.com",
          })
          .optional(),
      })
      .strict(),
});

const career = defineCollection({
  loader: file("src/data/career.json"),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        description: z.string(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date().optional(),
        logo: image(),
        website: z.url().optional(),
        type: z.enum(["work", "education"]),
      })
      .strict(),
});

const projects = defineCollection({
  loader: file("src/data/projects.json"),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        description: z.string(),
        image: image(),
        link: z.url().optional(),
        github: z.url().optional(),
        tags: z.array(z.string().min(1)),
      })
      .strict(),
});

export const collections = { blog, authors, career, projects };
