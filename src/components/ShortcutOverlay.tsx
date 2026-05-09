"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface ShortcutGroup {
  label: string;
  items: { keys: string[]; description: string }[];
}

const SHORTCUTS: ShortcutGroup[] = [
  {
    label: "Navigation",
    items: [
      { keys: ["⌘", "K"], description: "Open command palette" },
      { keys: ["G", "D"], description: "Go to dashboard" },
      { keys: ["G", "A"], description: "Go to activity" },
      { keys: ["G", "S"], description: "Go to settings" },
    ],
  },
  {
    label: "Document",
    items: [
      { keys: ["⌘", "S"], description: "Save version" },
      { keys: ["⌘", "Enter"], description: "Submit / confirm" },
      { keys: ["Esc"], description: "Cancel / close panel" },
    ],
  },
  {
    label: "View",
    items: [
      { keys: ["?"], description: "Show keyboard shortcuts" },
    ],
  },
];

export function ShortcutOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-border bg-surface shadow-[0_40px_80px_-20px_var(--shadow-color)]">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">Keyboard</p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">Shortcuts</h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground-3 hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="divide-y divide-border">
          {SHORTCUTS.map((group) => (
            <div key={group.label} className="px-6 py-5">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground-3">{group.label}</p>
              <div className="space-y-2.5">
                {group.items.map((item) => (
                  <div key={item.description} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-foreground-2">{item.description}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {item.keys.map((key) => (
                        <kbd
                          key={key}
                          className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded border border-border bg-surface-2 px-1.5 text-[11px] font-semibold text-foreground"
                        >
                          {key}
                        </kbd>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border px-6 py-3">
          <p className="text-xs text-foreground-3">Press <kbd className="rounded border border-border bg-surface-2 px-1 text-[10px]">?</kbd> to toggle this overlay</p>
        </div>
      </div>
    </>
  );
}
