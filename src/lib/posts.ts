import { getCollection } from "astro:content";
import { slugify } from "./utils";
import type { MarkdownHeading } from "astro";
import { estimateReadingTime } from "./readingTime";
import { fetchBlogPosts, resolveAuthorIds, type BlogPostApi } from "./blog-api";

export type BlogPostCard = {
  id: string;
  body?: string;
  data: {
    title: string;
    description: string;
    publicationDate: Date;
    modificationDate?: Date;
    cover?: string;
    tags?: Array<string>;
    showComments: boolean;
    authors: Array<{ collection: "authors"; id: string }>;
  };
  readingTime: number;
};

export function toBlogPostCard(post: BlogPostApi): BlogPostCard {
  const authorIds = resolveAuthorIds(post.authors);
  return {
    id: post.slug,
    body: post.body,
    data: {
      title: post.title,
      description: post.description,
      publicationDate: post.publicationDate,
      modificationDate: post.modificationDate ?? undefined,
      cover: post.cover ?? undefined,
      tags: post.tags,
      showComments: post.showComments,
      authors: authorIds.map((id) => ({ collection: "authors", id })),
    },
    readingTime: estimateReadingTime(post.body),
  };
}

export async function getPosts(options?: {
  take?: number;
  tag?: string | null;
}) {
  const apiPosts = await fetchBlogPosts();
  const collectionPosts =
    apiPosts.length > 0 ? [] : await getCollection("blog");
  let posts: Array<BlogPostCard> =
    apiPosts.length > 0
      ? apiPosts.map(toBlogPostCard)
      : collectionPosts.map((post) => ({
          ...post,
          readingTime: estimateReadingTime(post.body),
        }));

  const { tag, take } = options || {};

  if (tag) {
    posts = posts.filter((post) => post.data.tags?.includes(tag));
  }

  posts = posts.sort(
    (a, b) =>
      b.data.publicationDate.getTime() - a.data.publicationDate.getTime(),
  );

  if (take && take > 0) {
    posts = posts.slice(0, take);
  }

  return posts;
}

/**
 * Rank other posts by shared tags, then fall back to the most recent ones so
 * the related section is never empty. Internal links keep readers on the site
 * and help search engines discover and connect the blog's content.
 */
export async function getRelatedPosts(
  currentPost: { id: string; data: { tags?: Array<string> } },
  take = 2,
) {
  const currentTags = new Set(currentPost.data.tags ?? []);
  const sharedTagCount = (post: BlogPostCard) =>
    (post.data.tags ?? []).filter((tag) => currentTags.has(tag)).length;

  return (await getPosts())
    .filter((post) => post.id !== currentPost.id)
    .sort(
      (a, b) =>
        sharedTagCount(b) - sharedTagCount(a) ||
        b.data.publicationDate.getTime() - a.data.publicationDate.getTime(),
    )
    .slice(0, take);
}

export async function getBlogTags() {
  const posts = await getPosts();
  const tags = new Set<string>();
  posts.forEach(({ data }) => {
    data.tags?.forEach((tag) => tags.add(tag));
  });
  const tagList = [...tags]
    .sort((a, b) => a.localeCompare(b))
    .map((tag) => ({
      name: tag,
      slug: slugify(tag),
    }));
  return tagList;
}

export type TocEntry = MarkdownHeading & { children: Array<TocEntry> };

function diveChildren(item: TocEntry, depth: number): Array<TocEntry> {
  if (depth === 1) {
    return item.children;
  } else {
    // e.g., 2
    return diveChildren(item.children[item.children.length - 1], depth - 1);
  }
}

function generateNestedHeadings(
  headings: Array<MarkdownHeading>,
  options?: { maxDepth?: number },
) {
  headings = headings.filter(
    ({ depth }) => depth > 1 && depth <= (options?.maxDepth || 3),
  );

  const toc: Array<TocEntry> = [];

  for (const heading of headings) {
    if (toc.length === 0) {
      toc.push({
        ...heading,
        children: [],
      });
    } else {
      const lastItemInToc = toc[toc.length - 1];
      if (heading.depth < lastItemInToc.depth) {
        throw new Error(`Orphan heading found: ${heading.text}.`);
      }
      if (heading.depth === lastItemInToc.depth) {
        // same depth
        toc.push({
          ...heading,
          children: [],
        });
      } else {
        // higher depth
        // push into children, or children' children alike
        const gap = heading.depth - lastItemInToc.depth;
        const target = diveChildren(lastItemInToc, gap);
        target.push({
          ...heading,
          children: [],
        });
      }
    }
  }
  return toc;
}

export function generatePostHeadings(
  headings: Array<MarkdownHeading>,
): Array<TocEntry> {
  const sanitizedHeadings = headings.map((heading) =>
    heading.text.startsWith("#")
      ? { ...heading, text: heading.text.substring(1) }
      : heading,
  );
  return generateNestedHeadings(sanitizedHeadings);
}
