"use client";

import { useMemo } from "react";

interface TiptapNode {
  type: string;
  attrs?: { level?: number; [key: string]: unknown };
  content?: TiptapNode[];
  text?: string;
}

interface Heading {
  level: number;
  text: string;
  slug: string;
}

function extractText(nodes: TiptapNode[] | undefined): string {
  if (!nodes) return "";
  return nodes.map((n) => (n.type === "text" ? (n.text ?? "") : extractText(n.content))).join("");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function extractHeadings(doc: TiptapNode): Heading[] {
  const headings: Heading[] = [];
  if (!doc.content) return headings;
  for (const node of doc.content) {
    if (node.type === "heading") {
      const level = node.attrs?.level ?? 1;
      const text = extractText(node.content);
      if (text.trim()) {
        headings.push({ level, text, slug: slugify(text) });
      }
    }
  }
  return headings;
}

interface TableOfContentsProps {
  content: object;
  activeSlug?: string;
}

export function TableOfContents({ content, activeSlug }: TableOfContentsProps) {
  const headings = useMemo(() => extractHeadings(content as TiptapNode), [content]);

  if (headings.length === 0) return null;

  const scrollTo = (slug: string) => {
    // Tiptap renders heading text as data attributes — fall back to text search
    const els = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
    for (const el of Array.from(els)) {
      if (slugify(el.textContent ?? "") === slug) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        break;
      }
    }
  };

  return (
    <nav className="space-y-1">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground-3">Contents</p>
      {headings.map((h, i) => (
        <button
          key={i}
          type="button"
          onClick={() => scrollTo(h.slug)}
          style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
          className={`block w-full truncate rounded-[0.8rem] px-3 py-1.5 text-left text-xs transition-colors ${
            activeSlug === h.slug
              ? "bg-indigo-500/10 font-semibold text-indigo-500"
              : "text-foreground-2 hover:bg-surface-2 hover:text-foreground"
          }`}
        >
          {h.text}
        </button>
      ))}
    </nav>
  );
}
