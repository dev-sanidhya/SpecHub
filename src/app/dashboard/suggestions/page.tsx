"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GitMerge,
  GitPullRequest,
  Loader2,
  MessageSquare,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils";
import { useWorkspace } from "@/context/WorkspaceContext";

interface MySuggestion {
  id: string;
  title: string;
  description: string | null;
  status: "open" | "approved" | "rejected" | "merged" | "draft";
  created_at: string;
  document_id: string;
  doc_title: string;
  comments: number;
}

const STATUS_BADGE: Record<string, "warning" | "success" | "danger" | "outline"> = {
  open: "warning",
  approved: "success",
  merged: "success",
  rejected: "danger",
  draft: "outline",
};

export default function MySuggestionsPage() {
  const { activeWorkspace } = useWorkspace();
  const [suggestions, setSuggestions] = useState<MySuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace?.id) return;
    setLoading(true);
    fetch(`/api/suggestions/mine?workspace_id=${activeWorkspace.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSuggestions(data as MySuggestion[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeWorkspace?.id]);

  const open = suggestions.filter((s) => s.status === "open");
  const merged = suggestions.filter((s) => s.status === "merged");
  const other = suggestions.filter((s) => s.status !== "open" && s.status !== "merged");

  return (
    <div className="space-y-6 px-1 pb-6">
      <section className="panel overflow-hidden rounded-[2.2rem]">
        <div className="border-b border-border px-7 py-7 lg:px-8">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground-3">
            <GitPullRequest className="h-3.5 w-3.5" />
            My Suggestions
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-foreground">
            Your proposed changes
          </h1>
          <p className="mt-2 text-sm leading-7 text-foreground-2">
            All suggestions you have opened across documents in this workspace.
          </p>
        </div>

        <div className="grid gap-px bg-border md:grid-cols-3">
          <div className="bg-surface px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground-3">Open</p>
            <p className="mt-2 text-xl font-semibold text-foreground">{open.length}</p>
          </div>
          <div className="bg-surface px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground-3">Merged</p>
            <p className="mt-2 text-xl font-semibold text-foreground">{merged.length}</p>
          </div>
          <div className="bg-surface px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground-3">Total</p>
            <p className="mt-2 text-xl font-semibold text-foreground">{suggestions.length}</p>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-foreground-3" />
        </div>
      ) : suggestions.length === 0 ? (
        <div className="panel rounded-[2rem] px-8 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-surface-3">
            <GitPullRequest className="h-5 w-5 text-foreground-3" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">No suggestions yet</p>
          <p className="mt-1.5 text-sm leading-7 text-foreground-2">
            Open a document and suggest a change to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s) => (
            <Link
              key={s.id}
              href={`/dashboard/docs/${s.document_id}/suggestions/${s.id}`}
              className="panel block overflow-hidden rounded-[1.8rem] transition-colors hover:bg-surface-2/60"
            >
              <div className="flex items-start justify-between gap-4 px-6 py-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={STATUS_BADGE[s.status] ?? "outline"}>
                      {s.status === "merged" && <GitMerge className="mr-1 h-3 w-3" />}
                      {s.status === "rejected" && <X className="mr-1 h-3 w-3" />}
                      {s.status}
                    </Badge>
                    <span className="text-xs text-foreground-3">{s.doc_title}</span>
                  </div>
                  <p className="mt-2.5 truncate text-sm font-semibold text-foreground">{s.title}</p>
                  {s.description && (
                    <p className="mt-1 line-clamp-1 text-xs leading-6 text-foreground-3">{s.description}</p>
                  )}
                  <p className="mt-2 flex items-center gap-3 text-xs text-foreground-3">
                    <span>{formatRelativeTime(s.created_at)}</span>
                    {s.comments > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {s.comments}
                      </span>
                    )}
                  </p>
                </div>
                <GitPullRequest className="mt-0.5 h-4 w-4 shrink-0 text-foreground-3" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && other.length > 0 && (
        <p className="text-center text-xs text-foreground-3">
          {other.length} closed suggestion{other.length !== 1 ? "s" : ""} (rejected / draft) not shown above
        </p>
      )}
    </div>
  );
}
