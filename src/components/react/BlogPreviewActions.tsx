import { useState } from "react";
import { Button } from "@/components/react/ui/button";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";

type Props = {
  slug: string;
};

export default function BlogPreviewActions({ slug }: Props) {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasPublished, setHasPublished] = useState(false);

  async function publish() {
    if (
      !window.confirm(
        "Publish this post? Rebuild the Astro site afterwards so /blog, the sitemap, and RSS update.",
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
      setMessage(
        "Published. Rebuild and redeploy the site so the public /blog page goes live.",
      );
    } catch {
      setMessage("Publish failed. Check the API and try again.");
    } finally {
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
      <div className="flex gap-2">
        <Button
          type="button"
          disabled={isPending || hasPublished}
          onClick={() => {
            void publish();
          }}
        >
          <CheckCircleIcon size={16} weight="duotone" />
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
          <TrashIcon size={16} weight="duotone" />
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
