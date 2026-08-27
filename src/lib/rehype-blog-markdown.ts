type HastText = {
  type: "text";
  value: string;
};

type HastElement = {
  type: "element";
  tagName: string;
  properties?: Record<string, unknown>;
  children: Array<HastElement | HastText>;
};

type HastRoot = {
  type: "root";
  children: Array<HastElement | HastText>;
};

type HastParent = HastRoot | HastElement;

function addClass(properties: Record<string, unknown>, ...classNames: Array<string>) {
  const current = properties.className;
  const existing = Array.isArray(current)
    ? current.map(String)
    : typeof current === "string"
      ? current.split(/\s+/).filter(Boolean)
      : [];
  properties.className = [...existing, ...classNames];
}

function isEmptyText(node: HastElement | HastText) {
  return node.type === "text" && node.value.trim() === "";
}

function isSoleChild(parent: HastElement, child: HastElement) {
  return parent.children.filter((node) => !isEmptyText(node)).every(
    (node) => node === child,
  );
}

function childIndex(parent: HastParent, child: HastElement | HastText) {
  return parent.children.indexOf(child);
}

function walk(
  node: HastParent,
  parent: HastParent | null,
  grandparent: HastParent | null,
  visit: (
    element: HastElement,
    parent: HastParent,
    grandparent: HastParent | null,
  ) => void,
) {
  if (node.type === "element" && parent) {
    visit(node, parent, grandparent);
  }
  for (const child of node.children) {
    if (child.type === "element") {
      walk(child, node, parent, visit);
    }
  }
}

function figureForImage(image: HastElement): HastElement {
  const properties = image.properties ?? {};
  addClass(properties, "rounded-xl");
  image.properties = properties;
  const alt = String(properties.alt ?? "");
  const children: Array<HastElement | HastText> = [image];
  if (alt) {
    children.push({
      type: "element",
      tagName: "figcaption",
      properties: { className: ["flex", "justify-center", "text-center"] },
      children: [{ type: "text", value: alt }],
    });
  }
  return {
    type: "element",
    tagName: "figure",
    properties: { className: ["xl:-ml-16"] },
    children,
  };
}

function figureForCode(pre: HastElement): HastElement {
  const filename = String(pre.properties?.["data-filename"] ?? "");
  const children: Array<HastElement | HastText> = [];
  if (filename) {
    children.push({
      type: "element",
      tagName: "figcaption",
      properties: {
        className: [
          "flex",
          "items-center",
          "justify-between",
          "rounded-t-xl",
          "bg-muted",
          "px-3",
          "py-2",
          "text-xs",
          "text-muted-foreground",
        ],
      },
      children: [{ type: "text", value: filename }],
    });
    addClass(pre.properties ?? (pre.properties = {}), "mt-0", "rounded-t-none");
  }
  children.push({
    type: "element",
    tagName: "div",
    properties: { className: ["relative"] },
    children: [pre],
  });
  return {
    type: "element",
    tagName: "figure",
    properties: {
      className: ["group/code-block", "rounded-xl", "offset-border"],
    },
    children,
  };
}

/**
 * Markdown-only replacements for the old MDX `img` / `a` / `pre` mappings.
 */
export function rehypeBlogMarkdown() {
  return (tree: HastRoot) => {
    type Replacement = {
      parent: HastParent;
      index: number;
      node: HastElement;
    };
    const replacements: Array<Replacement> = [];

    walk(tree, null, null, (element, parent, grandparent) => {
      if (element.tagName === "a") {
        const href = String(element.properties?.href ?? "");
        const properties = element.properties ?? {};
        if (href.startsWith("http")) {
          properties.target = "_blank";
          properties.rel = "noreferrer";
        } else {
          properties["data-astro-prefetch"] = true;
        }
        element.properties = properties;
        return;
      }

      if (element.tagName === "img") {
        const figure = figureForImage(element);
        if (
          parent.type === "element" &&
          parent.tagName === "p" &&
          isSoleChild(parent, element) &&
          grandparent
        ) {
          replacements.push({
            parent: grandparent,
            index: childIndex(grandparent, parent),
            node: figure,
          });
          return;
        }
        replacements.push({
          parent,
          index: childIndex(parent, element),
          node: figure,
        });
        return;
      }

      if (element.tagName === "pre") {
        replacements.push({
          parent,
          index: childIndex(parent, element),
          node: figureForCode(element),
        });
      }
    });

    for (const replacement of replacements.toReversed()) {
      if (replacement.index < 0) {
        continue;
      }
      replacement.parent.children.splice(
        replacement.index,
        1,
        replacement.node,
      );
    }
  };
}
