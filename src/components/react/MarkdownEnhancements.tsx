import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import CopyToClipboardButton from "./CopyToClipboardButton";
import ImageZoom from "./ImageZoom";

export default function MarkdownEnhancements() {
  useEffect(() => {
    const roots = document.querySelectorAll<HTMLElement>(
      "[data-blog-markdown]:not([data-enhanced])",
    );
    const reactRoots: Array<ReturnType<typeof createRoot>> = [];

    roots.forEach((root) => {
      root.dataset.enhanced = "true";

      root.querySelectorAll<HTMLImageElement>("figure img").forEach((image) => {
        const holder = document.createElement("div");
        image.replaceWith(holder);
        const reactRoot = createRoot(holder);
        reactRoots.push(reactRoot);
        reactRoot.render(
          <ImageZoom className="not-prose">
            <img src={image.src} alt={image.alt} className="rounded-xl" />
          </ImageZoom>,
        );
      });

      root.querySelectorAll<HTMLPreElement>("pre[data-code]").forEach((pre) => {
        if (pre.dataset.noCopy === "true") {
          return;
        }
        const mount = document.createElement("div");
        pre.parentElement?.append(mount);
        const reactRoot = createRoot(mount);
        reactRoots.push(reactRoot);
        reactRoot.render(
          <CopyToClipboardButton code={pre.dataset.code ?? ""} />,
        );
      });
    });

    return () => {
      reactRoots.forEach((reactRoot) => {
        reactRoot.unmount();
      });
      roots.forEach((root) => {
        delete root.dataset.enhanced;
      });
    };
  }, []);

  return null;
}
