"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { Toolbar } from "./Toolbar";
import { SlashCommandMenu, SLASH_COMMANDS } from "./SlashCommandMenu";
import { useEffect, useState, useCallback } from "react";

interface DocEditorProps {
  content?: object | null;
  editable?: boolean;
  onChange?: (content: object) => void;
  placeholder?: string;
}

interface SlashMenuState {
  open: boolean;
  query: string;
  top: number;
  left: number;
  selectedIndex: number;
}

const CLOSED_SLASH: SlashMenuState = { open: false, query: "", top: 0, left: 0, selectedIndex: 0 };

export function DocEditor({
  content,
  editable = true,
  onChange,
  placeholder = "Start writing your PRD... (type / for commands)",
}: DocEditorProps) {
  const [slashMenu, setSlashMenu] = useState<SlashMenuState>(CLOSED_SLASH);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder }),
      Underline,
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content ?? "",
    editable,
    onUpdate: ({ editor: e }) => {
      onChange?.(e.getJSON());

      // Slash command detection
      if (!editable) return;
      const { $from } = e.state.selection;
      const textBefore = $from.node().textContent.slice(0, $from.parentOffset);
      const slashMatch = textBefore.match(/(?:^|\n)\/(\w*)$/);

      if (slashMatch) {
        try {
          const slashAbsPos = e.state.selection.from - slashMatch[0].length + (slashMatch[0].startsWith("\n") ? 1 : 0);
          const coords = e.view.coordsAtPos(slashAbsPos);
          const editorEl = e.view.dom.closest(".tiptap-editor-wrap") as HTMLElement | null;
          const editorRect = editorEl?.getBoundingClientRect() ?? { top: 0, left: 0 };

          setSlashMenu((prev) => ({
            open: true,
            query: slashMatch[1],
            top: coords.bottom + window.scrollY + 6,
            left: Math.max(8, coords.left + window.scrollX - editorRect.left + (editorEl ? editorRect.left : 0)),
            selectedIndex: prev.query !== slashMatch[1] ? 0 : prev.selectedIndex,
          }));
        } catch {
          setSlashMenu(CLOSED_SLASH);
        }
      } else {
        setSlashMenu(CLOSED_SLASH);
      }
    },
    immediatelyRender: false,
  });

  const executeSlashCommand = useCallback(
    (cmd: (typeof SLASH_COMMANDS)[number]) => {
      if (!editor) return;
      const { $from } = editor.state.selection;
      const textBefore = $from.node().textContent.slice(0, $from.parentOffset);
      const slashMatch = textBefore.match(/\/(\w*)$/);
      if (slashMatch) {
        const deleteFrom = editor.state.selection.from - slashMatch[0].length;
        editor.chain().focus().deleteRange({ from: deleteFrom, to: editor.state.selection.from }).run();
      }
      cmd.execute(editor);
      setSlashMenu(CLOSED_SLASH);
    },
    [editor]
  );

  // Keyboard navigation for slash menu
  useEffect(() => {
    if (!editor || !slashMenu.open) return;

    const filteredCount = SLASH_COMMANDS.filter((cmd) => {
      if (!slashMenu.query) return true;
      const q = slashMenu.query.toLowerCase();
      return cmd.label.toLowerCase().includes(q) || cmd.keywords.some((k) => k.includes(q));
    }).length;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!slashMenu.open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashMenu((prev) => ({ ...prev, selectedIndex: (prev.selectedIndex + 1) % filteredCount }));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashMenu((prev) => ({ ...prev, selectedIndex: (prev.selectedIndex - 1 + filteredCount) % filteredCount }));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const filtered = SLASH_COMMANDS.filter((cmd) => {
          if (!slashMenu.query) return true;
          const q = slashMenu.query.toLowerCase();
          return cmd.label.toLowerCase().includes(q) || cmd.keywords.some((k) => k.includes(q));
        });
        const cmd = filtered[slashMenu.selectedIndex];
        if (cmd) executeSlashCommand(cmd);
      } else if (e.key === "Escape") {
        setSlashMenu(CLOSED_SLASH);
      }
    };

    const editorDom = editor.view.dom;
    editorDom.addEventListener("keydown", handleKeyDown, true);
    return () => editorDom.removeEventListener("keydown", handleKeyDown, true);
  }, [editor, slashMenu, executeSlashCommand]);

  useEffect(() => {
    if (editor && !editor.isDestroyed) editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (editor && content && !editor.isDestroyed) {
      const current = editor.getJSON();
      if (JSON.stringify(current) !== JSON.stringify(content)) {
        editor.commands.setContent(content);
      }
    }
  }, [editor, content]);

  return (
    <div className="tiptap-editor-wrap flex flex-col h-full">
      {editable && <Toolbar editor={editor} />}
      <div className="flex-1 overflow-auto px-4 py-5 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-[78rem]">
          <div className="panel ambient-ring overflow-hidden rounded-[2.4rem]">
            <div className="relative z-10 flex items-center justify-between gap-4 border-b border-border bg-surface-2/70 px-6 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground-3">
                  {editable ? "Writing mode" : "Snapshot view"}
                </p>
                <p className="mt-1 text-sm text-foreground-2">
                  {editable ? "Type / for commands. Tables, headings, and lists available." : "A preserved version of the document."}
                </p>
              </div>
              <div className="hidden rounded-full border border-border bg-surface-5 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-foreground-3 sm:block">
                {editable ? "Live draft" : "Read only"}
              </div>
            </div>
            <div className="relative z-10 px-6 py-7 lg:px-14 lg:py-12">
              <div className="mx-auto max-w-[72ch]">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {slashMenu.open && editor && (
        <SlashCommandMenu
          editor={editor}
          query={slashMenu.query}
          position={{ top: slashMenu.top, left: slashMenu.left }}
          selectedIndex={slashMenu.selectedIndex}
          onSelect={executeSlashCommand}
          onClose={() => setSlashMenu(CLOSED_SLASH)}
        />
      )}
    </div>
  );
}
