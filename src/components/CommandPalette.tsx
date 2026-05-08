"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  FileText,
  FilePlus2,
  Loader2,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";

interface Doc {
  id: string;
  title: string;
  current_version_number: number;
  updated_at: string;
}

interface Command {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  workspaceId: string | null;
}

export function CommandPalette({ workspaceId }: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery("");
        setSelectedIndex(0);
      }
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [close]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
      if (workspaceId) fetchDocs("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fetchDocs = useCallback(async (q: string) => {
    if (!workspaceId) return;
    setLoadingDocs(true);
    try {
      const url = q.trim()
        ? `/api/documents?workspace_id=${workspaceId}&q=${encodeURIComponent(q.trim())}`
        : `/api/documents?workspace_id=${workspaceId}`;
      const res = await fetch(url);
      const data = await res.json();
      setDocs(Array.isArray(data) ? data.slice(0, 8) : []);
    } catch {
      setDocs([]);
    } finally {
      setLoadingDocs(false);
    }
  }, [workspaceId]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchDocs(query), 220);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query, open, fetchDocs]);

  // Static commands that always appear (filtered by query)
  const staticCommands: Command[] = [
    {
      id: "new-doc",
      label: "New document",
      sublabel: "Create a blank spec or pick a template",
      icon: <FilePlus2 className="h-4 w-4 text-indigo-500" />,
      action: () => { router.push("/dashboard/docs/new"); close(); },
    },
    {
      id: "activity",
      label: "Activity feed",
      sublabel: "Recent workspace events",
      icon: <Activity className="h-4 w-4 text-foreground-3" />,
      action: () => { router.push("/dashboard/activity"); close(); },
    },
    {
      id: "settings",
      label: "Settings",
      sublabel: "Workspace and team management",
      icon: <Settings className="h-4 w-4 text-foreground-3" />,
      action: () => { router.push("/dashboard/settings"); close(); },
    },
  ];

  const filteredStatic = query.trim()
    ? staticCommands.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        (c.sublabel?.toLowerCase().includes(query.toLowerCase()))
      )
    : staticCommands;

  const docCommands: Command[] = docs.map((d) => ({
    id: `doc-${d.id}`,
    label: d.title,
    sublabel: `v${d.current_version_number}`,
    icon: <FileText className="h-4 w-4 text-foreground-3" />,
    action: () => { router.push(`/dashboard/docs/${d.id}`); close(); },
  }));

  const allCommands = [...filteredStatic, ...docCommands];

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % Math.max(allCommands.length, 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + Math.max(allCommands.length, 1)) % Math.max(allCommands.length, 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        allCommands[selectedIndex]?.action();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedIndex, allCommands.length]);

  // Reset selected index on query change
  useEffect(() => { setSelectedIndex(0); }, [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/40 pt-[14vh] backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-border bg-surface shadow-[0_48px_96px_-24px_rgba(0,0,0,0.4)]">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          {loadingDocs
            ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-foreground-3" />
            : <Search className="h-4 w-4 shrink-0 text-foreground-3" />
          }
          <input
            ref={inputRef}
            type="text"
            placeholder="Search docs or run a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground-3 focus:outline-none"
          />
          <kbd className="hidden rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-foreground-3 sm:block">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {filteredStatic.length > 0 && (
            <div>
              <p className="px-5 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground-3">
                Commands
              </p>
              {filteredStatic.map((cmd, i) => (
                <CommandRow
                  key={cmd.id}
                  command={cmd}
                  selected={selectedIndex === i}
                  onSelect={cmd.action}
                  onHover={() => setSelectedIndex(i)}
                />
              ))}
            </div>
          )}

          {docCommands.length > 0 && (
            <div>
              <p className="px-5 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground-3">
                Documents
              </p>
              {docCommands.map((cmd, i) => (
                <CommandRow
                  key={cmd.id}
                  command={cmd}
                  selected={selectedIndex === filteredStatic.length + i}
                  onSelect={cmd.action}
                  onHover={() => setSelectedIndex(filteredStatic.length + i)}
                />
              ))}
            </div>
          )}

          {allCommands.length === 0 && !loadingDocs && (
            <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
              <Sparkles className="h-6 w-6 text-foreground-3" />
              <p className="text-sm text-foreground-2">No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}
        </div>

        <div className="border-t border-border px-5 py-3">
          <p className="text-[10px] text-foreground-3">
            <kbd className="mr-0.5 rounded border border-border bg-surface-2 px-1 py-0.5 font-mono">↑↓</kbd> navigate
            {" · "}
            <kbd className="mr-0.5 rounded border border-border bg-surface-2 px-1 py-0.5 font-mono">↵</kbd> open
            {" · "}
            <kbd className="mr-0.5 rounded border border-border bg-surface-2 px-1 py-0.5 font-mono">esc</kbd> close
          </p>
        </div>
      </div>
    </div>
  );
}

function CommandRow({
  command,
  selected,
  onSelect,
  onHover,
}: {
  command: Command;
  selected: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onSelect}
      onMouseEnter={onHover}
      className={`flex w-full items-center gap-3 px-5 py-3 text-left transition-colors ${
        selected ? "bg-indigo-500/10" : "hover:bg-surface-2/70"
      }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.9rem] border border-border bg-surface-2">
        {command.icon}
      </span>
      <div className="min-w-0">
        <p className={`truncate text-sm font-medium ${selected ? "text-foreground" : "text-foreground-2"}`}>
          {command.label}
        </p>
        {command.sublabel && (
          <p className="truncate text-xs text-foreground-3">{command.sublabel}</p>
        )}
      </div>
    </button>
  );
}
