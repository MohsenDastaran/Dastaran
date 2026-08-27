import { useState } from "react";
import { Button } from "@/components/react/ui/button";
import { Input } from "@/components/react/ui/input";
import { Textarea } from "@/components/react/ui/textarea";
import { Label } from "@/components/react/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/react/ui/dialog";
import FormItem from "@/components/react/FormItem";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";

export type BlogPreviewDraft = {
  title: string;
  description: string;
  body: string;
  cover: string;
  tags: string;
  showComments: boolean;
  publicationDate: string;
  authors: Array<string>;
};

type Props = {
  slug: string;
  draft: BlogPreviewDraft;
};

export default function BlogPreviewActions({ slug, draft }: Props) {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasPublished, setHasPublished] = useState(false);
  const [title, setTitle] = useState(draft.title);
  const [description, setDescription] = useState(draft.description);
  const [body, setBody] = useState(draft.body);
  const [cover, setCover] = useState(draft.cover);
  const [tags, setTags] = useState(draft.tags);
  const [showComments, setShowComments] = useState(draft.showComments);

  async function publish() {
    if (
      !window.confirm(
        "Publish this post? It will show on /blog on the next request.",
      )
    ) {
      return;
    }
    setIsPending(true);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/blog/${encodeURIComponent(slug)}/publish`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      if (!response.ok) {
        setMessage("Publish failed. Check the API and try again.");
        return;
      }
      setHasPublished(true);
      setMessage("Published. It is now available on /blog.");
    } catch {
      setMessage("Publish failed. Check the API and try again.");
    } finally {
      setIsPending(false);
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/blog/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          body,
          cover: cover.trim() ? cover.trim() : null,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          showComments,
          authors: draft.authors,
          publicationDate: draft.publicationDate,
          modificationDate: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        let error = "Save failed. Check the API and try again.";
        try {
          const payload: unknown = await response.json();
          if (
            payload &&
            typeof payload === "object" &&
            "error" in payload &&
            typeof payload.error === "string"
          ) {
            error = payload.error;
          }
        } catch {
          // Keep the default message.
        }
        setMessage(error);
        return;
      }
      window.location.reload();
    } catch {
      setMessage("Save failed. Check the API and try again.");
      setIsPending(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this post permanently from the backend?")) {
      return;
    }
    setIsPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/blog/${encodeURIComponent(slug)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        setMessage("Delete failed. Check the API and try again.");
        return;
      }
      window.location.assign("/blog/");
    } catch {
      setMessage("Delete failed. Check the API and try again.");
      setIsPending(false);
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap justify-end gap-2">
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>
            <PencilSimpleIcon data-icon="inline-start" />
            Edit
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <form className="grid gap-4" onSubmit={(event) => void save(event)}>
              <DialogHeader>
                <DialogTitle>Edit post</DialogTitle>
                <DialogDescription>
                  Saves to the API with PATCH. The preview reloads so you can
                  check the rendered Markdown.
                </DialogDescription>
              </DialogHeader>
              <FormItem>
                <Label htmlFor="preview-title">Title</Label>
                <Input
                  id="preview-title"
                  value={title}
                  required
                  onChange={(event) => {
                    setTitle(event.target.value);
                  }}
                />
              </FormItem>
              <FormItem>
                <Label htmlFor="preview-description">Description</Label>
                <Textarea
                  id="preview-description"
                  value={description}
                  rows={3}
                  onChange={(event) => {
                    setDescription(event.target.value);
                  }}
                />
              </FormItem>
              <FormItem>
                <Label htmlFor="preview-cover">Cover URL</Label>
                <Input
                  id="preview-cover"
                  type="text"
                  value={cover}
                  placeholder="https://…"
                  onChange={(event) => {
                    setCover(event.target.value);
                  }}
                />
              </FormItem>
              <FormItem>
                <Label htmlFor="preview-tags">Tags</Label>
                <Input
                  id="preview-tags"
                  value={tags}
                  placeholder="SEO, React Router 7"
                  onChange={(event) => {
                    setTags(event.target.value);
                  }}
                />
              </FormItem>
              <FormItem>
                <Label htmlFor="preview-body">Markdown body</Label>
                <Textarea
                  id="preview-body"
                  className="min-h-64 font-mono text-sm"
                  value={body}
                  required
                  onChange={(event) => {
                    setBody(event.target.value);
                  }}
                />
              </FormItem>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showComments}
                  onChange={(event) => {
                    setShowComments(event.target.checked);
                  }}
                />
                Show comments
              </label>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <Button
          type="button"
          disabled={isPending || hasPublished}
          onClick={() => {
            void publish();
          }}
        >
          <CheckCircleIcon data-icon="inline-start" />
          Publish
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={isPending}
          onClick={() => {
            void remove();
          }}
        >
          <TrashIcon data-icon="inline-start" />
          Delete
        </Button>
      </div>
      {message ? (
        <p className="max-w-xs text-right text-xs text-muted-foreground">
          {message}
        </p>
      ) : null}
    </div>
  );
}
