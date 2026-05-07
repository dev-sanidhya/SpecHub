"use client";

import { useEffect, useRef } from "react";
import { type Editor } from "@tiptap/react";
import {
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code2,
  Table, Minus, TextIcon,
} from "lucide-react";

interface SlashCommand {
  label: string;
  description: string;
  icon: React.ReactNode;
  keywords: string[];
  execute: (editor: Editor) => void;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    label: "Heading 1",
    description: "Large section heading",
    icon: <Heading1 className="h-4 w-4" />,
    keywords: ["h1", "heading", "title", "large"],
    execute: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: "Heading 2",
    description: "Medium section heading",
    icon: <Heading2 className="h-4 w-4" />,
    keywords: ["h2", "heading", "subtitle", "medium"],
    execute: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: "Heading 3",
    description: "Small section heading",
    icon: <Heading3 className="h-4 w-4" />,
    keywords: ["h3", "heading", "small"],
    execute: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    label: "Paragraph",
    description: "Plain text block",
    icon: <TextIcon className="h-4 w-4" />,
    keywords: ["text", "paragraph", "body", "plain"],
    execute: (e) => e.chain().focus().setParagraph().run(),
  },
  {
    label: "Bullet List",
    description: "Unordered list",
    icon: <List className="h-4 w-4" />,
    keywords: ["ul", "list", "bullet", "unordered"],
    execute: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    label: "Numbered List",
    description: "Ordered list",
    icon: <ListOrdered className="h-4 w-4" />,
    keywords: ["ol", "numbered", "ordered", "list"],
    execute: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    label: "Blockquote",
    description: "Highlighted quote or callout",
    icon: <Quote className="h-4 w-4" />,
    keywords: ["quote", "blockquote", "callout", "note"],
    execute: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    label: "Code Block",
    description: "Multi-line code snippet",
    icon: <Code2 className="h-4 w-4" />,
    keywords: ["code", "codeblock", "snippet", "pre"],
    execute: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    label: "Table",
    description: "3x3 table grid",
    icon: <Table className="h-4 w-4" />,
    keywords: ["table", "grid", "columns", "rows"],
    execute: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    label: "Divider",
    description: "Horizontal rule separator",
    icon: <Minus className="h-4 w-4" />,
    keywords: ["hr", "divider", "separator", "rule", "line"],
    execute: (e) => e.chain().focus().setHorizontalRule().run(),
  },
];

interface SlashCommandMenuProps {
  editor: Editor;
  query: string;
  position: { top: number; left: number };
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
}

export function SlashCommandMenu({
  query,
  position,
  selectedIndex,
  onSelect,
}: SlashCommandMenuProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = SLASH_COMMANDS.filter((cmd) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.keywords.some((k) => k.includes(q))
    );
  });

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (filtered.length === 0) return null;

  return (
    <div
      className="fixed z-50 w-64 overflow-hidden rounded-[1.4rem] border border-border bg-surface shadow-[0_24px_56px_-20px_var(--shadow-color)] backdrop-blur-xl"
      style={{ top: position.top, left: position.left }}
    >
      <div className="border-b border-border px-4 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-3">Commands</p>
      </div>
      <div ref={listRef} className="max-h-64 overflow-y-auto p-1.5">
        {filtered.map((cmd, i) => (
          <button
            key={cmd.label}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(cmd);
            }}
            className={`flex w-full items-center gap-3 rounded-[1rem] px-3 py-2.5 text-left transition-colors ${
              i === selectedIndex
                ? "bg-indigo-500/12 text-foreground"
                : "text-foreground-2 hover:bg-surface-2 hover:text-foreground"
            }`}
          >
            <span className={`shrink-0 ${i === selectedIndex ? "text-indigo-500" : "text-foreground-3"}`}>
              {cmd.icon}
            </span>
            <div>
              <p className="text-sm font-medium leading-none">{cmd.label}</p>
              <p className="mt-1 text-[11px] text-foreground-3">{cmd.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
