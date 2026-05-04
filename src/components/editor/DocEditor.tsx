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
      <div className="flex-1 overflow-auto px-4 py-4 lg:px-6 lg:py-6">
        <div className="mx-auto max-w-4xl">
          <div className="panel rounded-[2rem] overflow-hidden">
            <div className="border-b border-border bg-surface-2/70 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-foreground-3">
              {editable ? "Editing canvas" : "Document snapshot"}
            </div>
            <div className="px-6 py-6 lg:px-10 lg:py-8">
          <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
