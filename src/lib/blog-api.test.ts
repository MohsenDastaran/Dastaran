import { describe, expect, it } from "vitest";
import {
  blogPostApiSchema,
  getBlogApiUrl,
  parsePostsPayload,
  resolveAuthorIds,
} from "./blog-api";

const swaggerExample = {
  authors: ["string"],
  body: "I ran into this when I needed to generate a sitemap...\n\n## Install the package\n\n...",
  cover: "string",
  description: "Learn how to generate a sitemap.",
  modificationDate: "2026-08-27T11:53:38.954Z",
  publicationDate: "2026-08-27T11:53:38.954Z",
  showComments: true,
  slug: "how-to-generate-a-sitemap",
  status: "published",
  tags: ["SEO"],
  title: "How to generate a sitemap",
};

describe("blogPostApiSchema", () => {
  it("accepts a Swagger-shaped published post and drops an invalid cover", () => {
    const parsed = blogPostApiSchema.parse(swaggerExample);
    expect(parsed.slug).toBe("how-to-generate-a-sitemap");
    expect(parsed.cover).toBeUndefined();
    expect(parsed.showComments).toBe(true);
  });

  it("accepts SQLite-ish nulls and JSON-encoded tags", () => {
    const parsed = blogPostApiSchema.parse({
      slug: "sqlite-post",
      title: "SQLite post",
      description: "Stored in SQLite.",
      body: "Hello.",
      publicationDate: "2026-08-27T11:53:38.954Z",
      modificationDate: null,
      cover: "",
      tags: '["SEO","Tips and Tricks"]',
      showComments: 1,
      authors: null,
    });
    expect(parsed.tags).toEqual(["SEO", "Tips and Tricks"]);
    expect(parsed.showComments).toBe(true);
    expect(parsed.authors).toBeUndefined();
    expect(parsed.cover).toBeUndefined();
  });
});

describe("parsePostsPayload", () => {
  it("parses a published array and skips under-review posts", () => {
    const posts = parsePostsPayload([
      swaggerExample,
      { ...swaggerExample, slug: "still-draft", status: "under-review" },
    ]);
    expect(posts.map((post) => post.slug)).toEqual([
      "how-to-generate-a-sitemap",
    ]);
  });
});

describe("resolveAuthorIds", () => {
  it("falls back to MohsenDastaran for unknown API authors", () => {
    expect(resolveAuthorIds(["string"])).toEqual(["MohsenDastaran"]);
    expect(resolveAuthorIds(["MohsenDastaran"])).toEqual(["MohsenDastaran"]);
  });
});

describe("getBlogApiUrl", () => {
  it("uses BLOG_API_URL and strips a trailing slash", () => {
    const previous = process.env.BLOG_API_URL;
    process.env.BLOG_API_URL = "https://api.dastaran.com/";
    expect(getBlogApiUrl()).toBe("https://api.dastaran.com");
    if (previous === undefined) {
      delete process.env.BLOG_API_URL;
    } else {
      process.env.BLOG_API_URL = previous;
    }
  });
});
