import { contactFormSchema } from "@/lib/definitions";
import { resend } from "@/lib/resend";
import { parseSubmission, report } from "@conform-to/react/future";
import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { viewCount } from "@/db/schema";

export const server = {
  contact: defineAction({
    accept: "form",
    handler: async (formData) => {
      const submission = parseSubmission(formData);
      const result = contactFormSchema.safeParse(submission.payload);

      if (!result.success) {
        return {
          result: report(submission, {
            error: {
              issues: result.error.issues,
            },
          }),
        };
      }

      const {
        email,
        name,
        subject,
        phone,
        message,
        company: honeypot,
      } = result.data;

      if (honeypot !== undefined) {
        return {
          result: report(submission, {
            reset: true,
          }),
        };
      }

      const { error } = await resend.emails.send({
        from: "Kontaktformular <contact-form@nikolailehbr.ink>",
        replyTo: email,
        to: [
          import.meta.env.DEV
            ? "delivered@resend.dev"
            : "mail@nikolailehbr.ink",
        ],
        subject: subject ?? "New inquiry",
        html: `
        ${name && `<p>Name: ${name}</p>`}
        ${phone && `<p>Phone: ${phone}</p>`}
        <p>Message: ${message}</p>
    `,
        text: `
        ${name && `Name: ${name}\n`}
        ${phone && `Phone: ${phone}\n`}
        Message: ${message}
    `,
        tags: [
          {
            name: "category",
            value: "contact_form",
          },
        ],
      });

      if (error) {
        console.error(error);
        return {
          result: report(submission, {
            error: {
              formErrors: [
                "Failed to send the message. Please try again later.",
              ],
            },
          }),
        };
      }

      return {
        result: report(submission, { reset: true }),
        success: true,
      };
    },
  }),
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
