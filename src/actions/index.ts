import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { viewCount } from "@/db/schema";

export const server = {
  pageViews: {
    increment: defineAction({
      input: z.object({
        pathname: z.string(),
      }),
      async handler(input) {
        const { pathname } = input;

        const updatedViewCount = await db
          .insert(viewCount)
          .values({
            pathname,
          })
          .onConflictDoUpdate({
            target: viewCount.pathname,
            set: {
              views: sql`${viewCount.views} + 1`,
            },
          })
          .returning();
        return updatedViewCount[0].views;
      },
    }),
    get: defineAction({
      input: z.object({
        pathname: z.string(),
      }),
      async handler(input) {
        const { pathname } = input;
        const rows = await db
          .select()
          .from(viewCount)
          .where(eq(viewCount.pathname, pathname));
        return rows[0]?.views ?? 0;
      },
    }),
    getAll: defineAction({
      async handler() {
        const views = await db.select().from(viewCount);
        return views.reduce((acc, current) => acc + current.views, 0);
      },
    }),
  },
};
