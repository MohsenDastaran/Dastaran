export type Comment = {
  id: string;
  author: string;
  body: string;
  publishedAt: Date;
};

// Placeholder data until comments are loaded from an API.
export const DUMMY_COMMENTS: Array<Comment> = [
  {
    id: "1",
    author: "Alex Rivera",
    body: "Really helpful write-up - the examples made this click for me. Thanks for sharing.",
    publishedAt: new Date("2026-03-12T14:30:00Z"),
  },
  {
    id: "2",
    author: "Sam Chen",
    body: "I ran into the same issue last week. Going to try this approach on my project.",
    publishedAt: new Date("2026-03-14T09:15:00Z"),
  },
];
