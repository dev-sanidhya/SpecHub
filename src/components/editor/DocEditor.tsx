"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { Toolbar } from "./Toolbar";
import { useEffect } from "react";

interface DocEditorProps {
  content?: object | null;
  editable?: boolean;
  onChange?: (content: object) => void;
  placeholder?: string;
}

export function DocEditor({
  content,
  editable = true,
  onChange,
  placeholder = "Start writing your PRD...",
}: DocEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Underline,
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
    ],
    content: content ?? "",
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(editable);
    }
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
    <div className="flex flex-col h-full">
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
                  {editable ? "Structured product writing with room to think." : "A preserved version of the document."}
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
    </div>
  );
}
