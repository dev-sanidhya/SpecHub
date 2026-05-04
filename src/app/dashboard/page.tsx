"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock3,
  FileText,
  FolderOpen,
  GitPullRequest,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils";

interface Doc {
  id: string;
  title: string;
  current_version_number: number;
  updated_at: string;
  open_suggestions: number;
  created_by: string;
}

interface Workspace {
  id: string;
  name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const wsRes = await fetch("/api/workspace");
      const ws = await wsRes.json();
      setWorkspace(ws);

      const docsRes = await fetch(`/api/documents?workspace_id=${ws.id}`);
      setDocs(await docsRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadData]);

  async function createDoc() {
    if (!workspace) return;
    setCreating(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspace.id, title: "Untitled" }),
      });
      const doc = await res.json();
      router.push(`/dashboard/docs/${doc.id}`);
    } catch (error) {
      console.error(error);
      setCreating(false);
    }
  }

  const filtered = useMemo(
    () => docs.filter((doc) => doc.title.toLowerCase().includes(search.toLowerCase())),
    [docs, search]
  );

  const totalSuggestions = docs.reduce((sum, doc) => sum + doc.open_suggestions, 0);
  const recentDoc = docs
    .slice()
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8">
      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="panel rounded-[2rem] p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">Overview</p>
          <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                {workspace?.name ?? "Workspace"} is ready for structured document review.
              </h2>
              <p className="mt-3 text-base leading-7 text-foreground-2">
                Keep specs current, route edits through suggestions, and stop losing product decisions between versions.
              </p>
            </div>

            <Button size="lg" className="gap-2" onClick={createDoc} loading={creating}>
              <Plus className="h-4 w-4" />
              Create document
            </Button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-surface-2 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-3">Documents</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{docs.length}</p>
              <p className="mt-2 text-sm text-foreground-2">Specs tracked in this workspace.</p>
            </div>

            <div className="rounded-3xl bg-surface-2 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-3">Open suggestions</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{totalSuggestions}</p>
              <p className="mt-2 text-sm text-foreground-2">Changes waiting for review or merge.</p>
            </div>

            <div className="rounded-3xl bg-surface-2 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-3">Latest activity</p>
              <p className="mt-3 text-lg font-semibold tracking-tight text-foreground">
                {recentDoc ? formatRelativeTime(recentDoc.updated_at) : "No activity"}
              </p>
              <p className="mt-2 text-sm text-foreground-2">
                {recentDoc ? `${recentDoc.title} was updated most recently.` : "Create your first document to begin."}
              </p>
            </div>
          </div>
        </div>

        <div className="panel rounded-[2rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">Next best move</p>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
            {docs.length === 0 ? "Create the first living spec." : "Keep momentum on your most active document."}
          </h3>
          <p className="mt-3 text-sm leading-7 text-foreground-2">
            {docs.length === 0
              ? "Start with a single PRD and let version history, suggestions, and AI checks grow from there."
              : "The most useful workflow is simple: edit, submit suggestion, discuss, merge, repeat."}
          </p>

          {recentDoc ? (
            <Link
              href={`/dashboard/docs/${recentDoc.id}`}
              className="mt-6 block rounded-3xl border border-border bg-surface-2 p-5 transition-colors hover:bg-surface-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{recentDoc.title}</p>
                  <p className="mt-1 text-xs text-foreground-3">
                    Version {recentDoc.current_version_number} · updated {formatRelativeTime(recentDoc.updated_at)}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-foreground-3" />
              </div>
            </Link>
          ) : (
            <Button size="lg" className="mt-6 gap-2" onClick={createDoc} loading={creating}>
              <Plus className="h-4 w-4" />
              Create first document
            </Button>
          )}
        </div>
      </section>

      <section className="mt-6 panel rounded-[2rem] p-6 lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">Documents</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">Browse the current workspace</h2>
          </div>

          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-3" />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 w-full rounded-2xl border border-border bg-surface px-11 text-sm text-foreground placeholder:text-foreground-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/12"
            />
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-foreground-3" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-border-2 bg-surface-2 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-3 text-indigo-500">
                {search ? <Search className="h-6 w-6" /> : <FolderOpen className="h-6 w-6" />}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                {search ? "No matching documents" : "No documents yet"}
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-foreground-2">
                {search
                  ? "Try a different search term or clear the filter to see the full workspace."
                  : "Create the first document and start using suggestions, version history, and AI checks on real product work."}
              </p>
              {!search && (
                <Button size="lg" className="mt-6 gap-2" onClick={createDoc} loading={creating}>
                  <Plus className="h-4 w-4" />
                  Create document
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filtered.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/dashboard/docs/${doc.id}`}
                  className="group rounded-[1.75rem] border border-border bg-surface p-5 shadow-[0_16px_36px_-30px_var(--shadow-color)] transition-all hover:-translate-y-0.5 hover:border-border-2 hover:bg-surface-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/12 text-indigo-500">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold tracking-tight text-foreground">{doc.title}</h3>
                        <p className="mt-1 text-sm text-foreground-2">
                          Version {doc.current_version_number} · maintained by {doc.created_by.slice(0, 8)}
                        </p>
                      </div>
                    </div>

                    <Badge variant="outline">v{doc.current_version_number}</Badge>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-foreground-3">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-4 w-4" />
                      {formatRelativeTime(doc.updated_at)}
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <GitPullRequest className="h-4 w-4" />
                      {doc.open_suggestions} open suggestion{doc.open_suggestions === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-indigo-500">
                    Open document
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
