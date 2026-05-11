"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  Archive,
  ArrowRight,
  Clock3,
  FileText,
  FolderOpen,
  GitPullRequest,
  Loader2,
  Orbit,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { UserChip } from "@/components/UserChip";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { formatRelativeTime } from "@/lib/utils";

interface Doc {
  id: string;
  title: string;
  current_version_number: number;
  updated_at: string;
  open_suggestions: number;
  created_by: string;
  tags?: string[];
}

interface ChangelogEntry {
  id: string;
  version_number: number;
  ai_summary: string;
  created_by: string;
  created_at: string;
  document_id: string;
  doc_title: string;
}

interface Workspace {
  id: string;
  name: string;
}


export default function DashboardPage() {
  const router = useRouter();
  const { activeWorkspace } = useWorkspace();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const workspaceRef = useRef<Workspace | null>(null);

  const loadData = useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    workspaceRef.current = activeWorkspace;
    try {
      const [docsRes, changelogRes] = await Promise.all([
        fetch(`/api/documents?workspace_id=${activeWorkspace.id}&archived=${showArchived}`),
        fetch(`/api/workspace/changelog?workspace_id=${activeWorkspace.id}`),
      ]);
      setDocs(await docsRes.json());
      const cl = await changelogRes.json();
      setChangelog(Array.isArray(cl) ? cl : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspace?.id, showArchived]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  // Debounced search - fires 350ms after user stops typing
  useEffect(() => {
    if (!workspaceRef.current) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!search.trim()) {
      searchTimer.current = setTimeout(async () => {
        setSearching(true);
        try {
          const res = await fetch(`/api/documents?workspace_id=${workspaceRef.current!.id}&archived=${showArchived}`);
          setDocs(await res.json());
        } catch (e) { console.error(e); }
        finally { setSearching(false); }
      }, 0);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/documents?workspace_id=${workspaceRef.current!.id}&archived=${showArchived}&q=${encodeURIComponent(search.trim())}`
        );
        setDocs(await res.json());
      } catch (e) { console.error(e); }
      finally { setSearching(false); }
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, showArchived]);

  async function createDoc() {
    if (!activeWorkspace) return;
    setCreating(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: activeWorkspace.id, title: "Untitled" }),
      });
      const doc = await res.json();
      router.push(`/dashboard/docs/${doc.id}`);
    } catch (error) {
      console.error(error);
      setCreating(false);
    }
  }

  const filtered = activeTag ? docs.filter((d) => d.tags?.includes(activeTag)) : docs;

  const allTags = Array.from(new Set(docs.flatMap((d) => d.tags ?? [])));
  const totalSuggestions = docs.reduce((sum, doc) => sum + doc.open_suggestions, 0);
  const recentDoc = docs
    .slice()
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

  return (
    <div className="space-y-6 px-1 pb-6">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel overflow-hidden rounded-[2.2rem]">
          <div className="border-b border-border px-7 py-8 lg:px-8">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
              <Orbit className="h-3.5 w-3.5" />
              Repository view
            </p>
            <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-4xl font-semibold tracking-[-0.05em] text-foreground">
                  {activeWorkspace?.name ?? "Workspace"} keeps specs reviewable.
                </h2>
                <p className="mt-4 text-base leading-8 text-foreground-2">
                  Track living product documents as the source of truth, then route edits through explicit review instead of silent rewrites.
                </p>
              </div>

              <Button size="lg" className="gap-2 shrink-0" onClick={createDoc} loading={creating}>
                <Plus className="h-4 w-4" />
                New spec
              </Button>
            </div>
          </div>

          <div className="grid gap-px bg-border md:grid-cols-3">
            <div className="bg-surface px-7 py-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground-3">Documents</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">{docs.length}</p>
              <p className="mt-2 text-sm leading-6 text-foreground-2">Tracked source specs.</p>
            </div>
            <div className="bg-surface px-7 py-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground-3">Open suggestions</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">{totalSuggestions}</p>
              <p className="mt-2 text-sm leading-6 text-foreground-2">Changes awaiting review.</p>
            </div>
            <div className="bg-surface px-7 py-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground-3">Latest activity</p>
              <p className="mt-3 text-lg font-semibold tracking-tight text-foreground">
                {recentDoc ? formatRelativeTime(recentDoc.updated_at) : "No activity"}
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground-2">
                {recentDoc ? recentDoc.title : "Create your first document to begin."}
              </p>
            </div>
          </div>
        </div>

        <div className="panel rounded-[2.2rem] p-7 lg:p-8">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
            <Sparkles className="h-3.5 w-3.5" />
            Current focus
          </p>
          <h3 className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-foreground">
            {docs.length === 0 ? "Create the first living spec." : "Resume the most active document."}
          </h3>
          <p className="mt-4 text-sm leading-7 text-foreground-2">
            {docs.length === 0
              ? "Start with a single PRD, establish the current version, and let the review trail build from real changes."
              : "A strong loop is simple: update the source, submit a suggestion when needed, review diffs, merge, then move forward."}
          </p>

          {recentDoc ? (
            <Link
              href={`/dashboard/docs/${recentDoc.id}`}
              className="mt-6 block rounded-[1.5rem] border border-border bg-surface-2/70 p-5 transition-all hover:-translate-y-0.5 hover:border-border-2 hover:bg-surface-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{recentDoc.title}</p>
                  <p className="mt-1 text-xs text-foreground-3">
                    Version {recentDoc.current_version_number} · {recentDoc.open_suggestions} open suggestion
                    {recentDoc.open_suggestions === 1 ? "" : "s"}
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

      {changelog.length > 0 && (
        <section className="panel overflow-hidden rounded-[2.2rem]">
          <div className="border-b border-border px-7 py-7 lg:px-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  Recent changes
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-foreground">Changelog</h2>
                <p className="mt-3 text-sm leading-7 text-foreground-2">
                  AI summaries of every change that was reviewed and merged.
                </p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-border">
            {changelog.map((entry) => (
              <div key={entry.id} className="flex items-start gap-5 px-7 py-6 lg:px-8">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[1rem] bg-indigo-500/10">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/docs/${entry.document_id}`}
                      className="text-sm font-semibold text-foreground transition-colors hover:text-indigo-500"
                    >
                      {entry.doc_title}
                    </Link>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-foreground-3">
                      v{entry.version_number}
                    </span>
                    <span className="text-xs text-foreground-3">
                      {formatRelativeTime(entry.created_at)}
                    </span>
                    <UserChip userId={entry.created_by} />
                  </div>
                  <p className="mt-2 text-sm leading-7 text-foreground-2">{entry.ai_summary}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="panel overflow-hidden rounded-[2.2rem]">
        <div className="border-b border-border px-7 py-7 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">Documents</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-foreground">Repository index</h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowArchived((v) => !v)}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                  showArchived
                    ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-500"
                    : "border-border text-foreground-3 hover:text-foreground"
                }`}
              >
                <Archive className="h-3.5 w-3.5" />
                {showArchived ? "Active" : "Archived"}
              </button>
              <div className="relative w-full lg:w-72">
                {searching ? (
                  <Loader2 className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 animate-spin text-foreground-3" />
                ) : (
                  <Search className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-foreground-3" />
                )}
                <Input
                  type="text"
                  placeholder="Search titles and content..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-11"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-border bg-surface-2/35 px-7 py-3.5 lg:px-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-foreground-2">
            <span className="font-medium text-foreground">{filtered.length}</span>
            <span>{filtered.length === 1 ? "document" : "documents"}</span>
            <span className="text-foreground-3">·</span>
            <span>{totalSuggestions} open suggestions across the workspace</span>
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-7 py-3 lg:px-8">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-3 mr-1">Filter</span>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  activeTag === tag
                    ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-500"
                    : "border-border text-foreground-3 hover:text-foreground"
                }`}
              >
                {tag}
              </button>
            ))}
            {activeTag && (
              <button type="button" onClick={() => setActiveTag(null)} className="text-[11px] text-foreground-3 underline hover:text-foreground">clear</button>
            )}
          </div>
        )}

        <div>
          {loading ? (
            <div className="flex min-h-80 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-foreground-3" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center px-7 py-14 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-surface-3 text-indigo-500">
                {search ? <Search className="h-7 w-7" /> : <FolderOpen className="h-7 w-7" />}
              </div>
              <h3 className="mt-6 text-xl font-semibold text-foreground">
                {search ? "No matching documents" : "No documents yet"}
              </h3>
              <p className="mt-3 max-w-md text-sm leading-7 text-foreground-2">
                {search
                  ? "Try a different search term or clear the filter to see the full workspace."
                  : "Create the first document and start using suggestions, version history, and AI checks on real product work."}
              </p>
              {!search && (
                <Button size="lg" className="mt-7 gap-2" onClick={createDoc} loading={creating}>
                  <Plus className="h-4 w-4" />
                  Create document
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/dashboard/docs/${doc.id}`}
                  className="block px-7 py-6 transition-colors hover:bg-surface-2/45 lg:px-8"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.1rem] bg-indigo-500/12 text-indigo-500">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-semibold text-foreground">{doc.title}</h3>
                            <Badge variant="outline">v{doc.current_version_number}</Badge>
                            {doc.open_suggestions > 0 && <Badge variant="warning">{doc.open_suggestions} open</Badge>}
                            {(doc.tags ?? []).map((tag) => (
                              <span key={tag} className="rounded-full border border-indigo-500/20 bg-indigo-500/8 px-2 py-0.5 text-[10px] font-semibold text-indigo-500">{tag}</span>
                            ))}
                          </div>
                          <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-foreground-2">
                            <span>Maintained by</span>
                            <UserChip userId={doc.created_by} showYou />
                            <span>· updated {formatRelativeTime(doc.updated_at)}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 text-sm text-foreground-3 xl:justify-end">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-4 w-4" />
                        {formatRelativeTime(doc.updated_at)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <GitPullRequest className="h-4 w-4" />
                        {doc.open_suggestions} open suggestion{doc.open_suggestions === 1 ? "" : "s"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-indigo-500">
                        Open
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
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
