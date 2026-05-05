"use client";

import { type Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline, Strikethrough, Code,
  Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Minus, Link, Highlighter,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolbarProps { editor: Editor | null; }
interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-2xl text-sm transition-all",
        active
          ? "bg-indigo-500/15 text-indigo-500 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.18)]"
          : "text-foreground-2 hover:bg-surface-3 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-6 w-px bg-border-2" />;
}

export function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null;
  return (
    <div className="sticky top-0 z-20 border-b border-border bg-surface/85 px-4 py-3 backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-1 rounded-[1.75rem] border border-border bg-surface-2/75 p-1.5 shadow-[0_18px_36px_-30px_var(--shadow-color)]">
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><Bold className="w-3.5 h-3.5" /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><Italic className="w-3.5 h-3.5" /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline"><Underline className="w-3.5 h-3.5" /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough"><Strikethrough className="w-3.5 h-3.5" /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="Highlight"><Highlighter className="w-3.5 h-3.5" /></ToolbarButton>
      <Divider />
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1"><Heading1 className="w-3.5 h-3.5" /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2"><Heading2 className="w-3.5 h-3.5" /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3"><Heading3 className="w-3.5 h-3.5" /></ToolbarButton>
      <Divider />
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list"><List className="w-3.5 h-3.5" /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered list"><ListOrdered className="w-3.5 h-3.5" /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote"><Quote className="w-3.5 h-3.5" /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code"><Code className="w-3.5 h-3.5" /></ToolbarButton>
      <Divider />
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="Divider"><Minus className="w-3.5 h-3.5" /></ToolbarButton>
      <ToolbarButton
        onClick={() => { const url = window.prompt("Enter URL"); if (url) editor.chain().focus().setLink({ href: url }).run(); }}
        active={editor.isActive("link")} title="Link"
      ><Link className="w-3.5 h-3.5" /></ToolbarButton>
      </div>
    </div>
  );
}
