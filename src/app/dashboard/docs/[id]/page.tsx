"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronLeft,
  Clock,
  FileWarning,
  Eye,
  GitBranchPlus,
  GitPullRequest,
  History,
  Loader2,
  PenLine,
  Save,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DocEditor } from "@/components/editor/DocEditor";
import { DiffView, jsonToText } from "@/components/diff/DiffView";
import { Input } from "@/components/ui/Input";
import { formatRelativeTime } from "@/lib/utils";

type Mode = "read" | "suggest" | "history";
type SuggestionStatus = "open" | "approved" | "rejected" | "merged";

interface Contradiction {
  section1: string;
  section2: string;
  issue: string;
}

interface Version {
  id: string;
  version_number: number;
  ai_summary: string | null;
  created_by: string;
  created_at: string;
  content?: object;
}

interface Suggestion {
  id: string;
  title: string;
  description: string | null;
  status: SuggestionStatus;
  created_by: string;
  created_at: string;
  comments: number;
}

interface Doc {
  id: string;
  title: string;
  current_version_id: string | null;
  current_version_number: number;
  currentVersion?: { content: object };
}

const MODE_LABELS: Record<Mode, { title: string; description: string }> = {
  read: {
    title: "Document",
    description: "This is the source-of-truth spec. Edit it directly, then save a version snapshot when the state is worth preserving.",
  },
  suggest: {
    title: "Suggestion draft",
    description: "Prepare a reviewable change set against the current version instead of rewriting the source silently.",
  },
  history: {
    title: "Version history",
    description: "Inspect the timeline of saved states and compare what the document meant at each point.",
  },
};

function authorLabel(value: string) {
  return `@${value.slice(0, 8)}`;
}

export default function DocPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;
  const isNew = docId === "new";

  const [mode, setMode] = useState<Mode>("read");
  const [doc, setDoc] = useState<Doc | null>(null);
  const [title, setTitle] = useState("Untitled");
  const [currentContent, setCurrentContent] = useState<object>({ type: "doc", content: [] });
  const [suggestContent, setSuggestContent] = useState<object>({ type: "doc", content: [] });
  const [suggestTitle, setSuggestTitle] = useState("");
  const [suggestDesc, setSuggestDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuggestForm, setShowSuggestForm] = useState(false);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [selectedVersionContent, setSelectedVersionContent] = useState<object | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [workspace, setWorkspace] = useState<{ id: string } | null>(null);
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [checkingContradictions, setCheckingContradictions] = useState(false);
  const contradictionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/workspace").then((r) => r.json()).then(setWorkspace);
  }, []);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [docData, versionsData, suggestionsData] = await Promise.all([
          fetch(`/api/documents/${docId}`).then((r) => r.json()),
          fetch(`/api/documents/${docId}/versions`).then((r) => r.json()),
          fetch(`/api/documents/${docId}/suggestions`).then((r) => r.json()),
        ]);

        if (cancelled) return;

        setDoc(docData);
        setTitle(docData.title ?? "Untitled");
        if (docData.currentVersion?.content) {
          const content = docData.currentVersion.content as object;
          setCurrentContent(content);
          setSuggestContent(content);
        }
        setVersions(versionsData);
        if (versionsData.length > 0) setSelectedVersion(versionsData[0]);
        setSuggestions(suggestionsData);
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [docId, isNew]);

  useEffect(() => {
    if (!selectedVersion) return;
    if (doc && selectedVersion.id === doc.current_version_id) {
      const timer = setTimeout(() => setSelectedVersionContent(currentContent), 0);
      return () => clearTimeout(timer);
    }
    fetch(`/api/documents/${docId}/versions/${selectedVersion.id}`)
      .then((r) => r.json())
      .then((v) => setSelectedVersionContent(v.content ?? null))
      .catch(console.error);
  }, [selectedVersion, doc, currentContent, docId]);

  const runContradictionCheck = useCallback(
    (content: object) => {
      if (contradictionTimer.current) clearTimeout(contradictionTimer.current);
      contradictionTimer.current = setTimeout(async () => {
        setCheckingContradictions(true);
        try {
          const res = await fetch(`/api/documents/${docId}/check`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          });
          const data = await res.json();
          setContradictions(data.contradictions ?? []);
        } catch {
          // silent fail
        } finally {
          setCheckingContradictions(false);
        }
      }, 3000);
    },
    [docId]
  );

  const handleContentChange = useCallback(
    (content: object) => {
      setCurrentContent(content);
      if (!isNew && mode === "read") runContradictionCheck(content);
    },
    [isNew, mode, runContradictionCheck]
  );

  const handleSaveNew = useCallback(async () => {
    if (!workspace) return;
    setSaving(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspace.id, title: title || "Untitled" }),
      });
      const newDoc = await res.json();
      await fetch(`/api/documents/${newDoc.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: currentContent }),
      });
      router.push(`/dashboard/docs/${newDoc.id}`);
    } finally {
      setSaving(false);
    }
  }, [workspace, title, currentContent, router]);

  const handleSaveVersion = useCallback(async () => {
    if (!doc) return;
    setSaving(true);
    try {
      await fetch(`/api/documents/${docId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: currentContent }),
      });
      const [updated, updatedVersions] = await Promise.all([
        fetch(`/api/documents/${docId}`).then((r) => r.json()),
        fetch(`/api/documents/${docId}/versions`).then((r) => r.json()),
      ]);
      setDoc(updated);
      setVersions(updatedVersions);
      if (updatedVersions.length > 0) setSelectedVersion(updatedVersions[0]);
    } finally {
      setSaving(false);
    }
  }, [doc, docId, currentContent]);

  const handleTitleBlur = useCallback(async () => {
    if (!doc || title === doc.title) return;
    await fetch(`/api/documents/${docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  }, [doc, docId, title]);

  const handleSubmitSuggestion = useCallback(async () => {
    if (!suggestTitle.trim() || !doc?.current_version_id) return;
    setSubmitting(true);
    try {
      await fetch(`/api/documents/${docId}/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: suggestTitle,
          description: suggestDesc || null,
          proposed_content: suggestContent,
          base_version_id: doc.current_version_id,
        }),
      });
      setSuggestions(await fetch(`/api/documents/${docId}/suggestions`).then((r) => r.json()));
      setMode("read");
      setShowSuggestForm(false);
      setSuggestTitle("");
      setSuggestDesc("");
    } finally {
      setSubmitting(false);
    }
  }, [suggestTitle, suggestDesc, suggestContent, doc, docId]);

  const handleDeleteDocument = useCallback(async () => {
    if (!doc || deleteConfirmTitle.trim() !== doc.title) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete document");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);
      setDeleting(false);
    }
  }, [deleteConfirmTitle, doc, docId, router]);

  const currentText = jsonToText(currentContent);
  const suggestText = jsonToText(suggestContent);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-9rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-border-3" />
      </div>
    );
  }

  const openSuggestions = suggestions.filter((suggestion) => suggestion.status === "open").length;

  if (isNew) {
    return (
      <div className="space-y-6 px-1 pb-6">
        <section className="panel rounded-[2.2rem] px-6 py-7 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">New document</p>
                <input
                  type="text"
                  placeholder="Untitled document"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-3 w-full bg-transparent text-3xl font-semibold tracking-[-0.05em] text-foreground placeholder:text-foreground-3 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>
            <Button size="lg" onClick={handleSaveNew} loading={saving} className="gap-2 shrink-0">
              <Save className="h-4 w-4" />
              Save document
            </Button>
          </div>
        </section>

        <div className="panel rounded-[2.2rem] p-3 lg:p-4">
          <DocEditor content={null} editable onChange={setCurrentContent} placeholder="Start writing your PRD..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-1 pb-6">
      <section className="panel overflow-hidden rounded-[2.2rem]">
        <div className="border-b border-border px-6 py-7 lg:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                </Link>
                <Badge variant="outline">spec</Badge>
                <Badge variant="outline">v{doc?.current_version_number ?? 1}</Badge>
                {openSuggestions > 0 && <Badge variant="warning">{openSuggestions} open suggestions</Badge>}
              </div>

              <div className="mt-5 min-w-0">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  className="w-full bg-transparent text-3xl font-semibold tracking-[-0.05em] text-foreground focus:outline-none"
                />
                <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground-2">{MODE_LABELS[mode].description}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:items-end xl:shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                {mode === "read" && (
                  <Button variant="secondary" size="md" onClick={handleSaveVersion} loading={saving} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save version
                  </Button>
                )}
                {mode === "suggest" && !showSuggestForm && (
                  <Button size="md" onClick={() => setShowSuggestForm(true)} className="gap-2">
                    <GitBranchPlus className="h-4 w-4" />
                    Open suggestion
                  </Button>
                )}
              </div>

              <div className="flex items-center rounded-full border border-border bg-surface-2/80 p-1">
                {(["read", "suggest", "history"] as Mode[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => setMode(item)}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                      mode === item ? "bg-surface text-foreground shadow-[0_12px_28px_-24px_var(--shadow-color)]" : "text-foreground-3 hover:text-foreground"
                    }`}
                  >
                    {item === "read" && <Eye className="h-3.5 w-3.5" />}
                    {item === "suggest" && <PenLine className="h-3.5 w-3.5" />}
                    {item === "history" && <History className="h-3.5 w-3.5" />}
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-border md:grid-cols-4">
          <div className="bg-surface px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground-3">Current version</p>
            <p className="mt-2.5 text-lg font-semibold text-foreground">v{doc?.current_version_number ?? 1}</p>
          </div>
          <div className="bg-surface px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground-3">Open suggestions</p>
            <p className="mt-2.5 text-lg font-semibold text-foreground">{openSuggestions}</p>
          </div>
          <div className="bg-surface px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground-3">Saved versions</p>
            <p className="mt-2.5 text-lg font-semibold text-foreground">{versions.length}</p>
          </div>
          <div className="bg-surface px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground-3">Mode</p>
            <p className="mt-2.5 text-lg font-semibold capitalize text-foreground">{MODE_LABELS[mode].title}</p>
          </div>
        </div>
      </section>

      {mode === "history" ? (
        <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <aside className="panel overflow-hidden rounded-[2rem]">
            <div className="border-b border-border px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">Version timeline</p>
            </div>
            <div className="space-y-2.5 p-4">
              {versions.length === 0 && <p className="px-2 py-2 text-xs text-foreground-3">No versions yet.</p>}
              {versions.map((version) => (
                <button
                  key={version.id}
                  onClick={() => setSelectedVersion(version)}
                  className={`w-full rounded-[1.35rem] border px-4 py-4 text-left transition-all ${
                    selectedVersion?.id === version.id
                      ? "border-indigo-500/25 bg-indigo-500/10"
                      : "border-border bg-surface-2/60 hover:bg-surface-2"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-foreground">v{version.version_number}</span>
                    {version.id === versions[0]?.id && <Badge variant="success">Current</Badge>}
                  </div>
                  <p className="mt-2.5 flex items-center gap-1.5 text-xs text-foreground-3">
                    <Clock className="h-3.5 w-3.5" />
                    {formatRelativeTime(version.created_at)}
                  </p>
                  <p className="mt-1.5 text-xs text-foreground-3">Saved by {authorLabel(version.created_by)}</p>
                  {version.ai_summary && (
                    <p className="mt-3 flex items-start gap-2 text-xs leading-6 text-foreground-2">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
                      {version.ai_summary}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </aside>

          <div className="space-y-6">
            {selectedVersion?.ai_summary && (
              <div className="panel-soft rounded-[1.8rem] px-6 py-5">
                <p className="flex items-start gap-3 text-sm leading-7 text-foreground-2">
                  <Sparkles className="mt-1 h-4 w-4 shrink-0 text-indigo-500" />
                  <span>
                    <span className="font-semibold text-foreground">AI changelog:</span> {selectedVersion.ai_summary}
                  </span>
                </p>
              </div>
            )}

            <div className="panel rounded-[2rem] p-3 lg:p-4">
              {selectedVersionContent ? (
                <DocEditor content={selectedVersionContent} editable={false} />
              ) : (
                <div className="flex h-[calc(100vh-22rem)] items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-border-3" />
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            {mode === "suggest" && !showSuggestForm && (
              <div className="panel-soft rounded-[1.8rem] px-6 py-5">
                <p className="text-sm font-semibold text-foreground">Branch from the current source.</p>
                <p className="mt-2 text-sm leading-7 text-foreground-2">
                  Draft changes in isolation, review the diff, then publish them as a suggestion for discussion and merge.
                </p>
              </div>
            )}

            <div className="panel rounded-[2rem] p-3 lg:p-4">
              {mode === "read" && <DocEditor content={currentContent} editable onChange={handleContentChange} />}

              {mode === "suggest" &&
                (showSuggestForm ? (
                  <div className="space-y-5 p-4 lg:p-5">
                    <div className="px-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">Compare changes</p>
                      <p className="mt-2 text-sm leading-7 text-foreground-2">
                        This preview compares your draft against the current source version before it becomes a review item.
                      </p>
                    </div>
                    <div className="panel-soft overflow-hidden rounded-[1.8rem]">
                      <DiffView oldText={currentText} newText={suggestText} />
                    </div>
                  </div>
                ) : (
                  <DocEditor content={suggestContent} editable onChange={setSuggestContent} />
                ))}
            </div>
          </div>

          <aside className="space-y-6">
            {mode === "read" && (
              <div className="panel overflow-hidden rounded-[2rem]">
                <div className="border-b border-border px-6 py-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Checks
                    </p>
                    {checkingContradictions ? (
                      <Loader2 className="h-4 w-4 animate-spin text-foreground-3" />
                    ) : contradictions.length === 0 ? (
                      <Badge variant="success">Passing</Badge>
                    ) : (
                      <Badge variant="warning">{contradictions.length}</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3 p-6">
                  {contradictions.length > 0 ? (
                    contradictions.map((contradiction, index) => (
                      <div key={index} className="rounded-[1.35rem] border border-amber-500/20 bg-amber-500/8 p-4">
                        <p className="flex items-start gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                          {contradiction.issue}
                        </p>
                        <p className="mt-2 text-xs leading-6 text-foreground-2">
                          &ldquo;{contradiction.section1}&rdquo; vs &ldquo;{contradiction.section2}&rdquo;
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm leading-7 text-foreground-2">
                      Contradiction checks run automatically while the current document changes.
                    </p>
                  )}
                </div>
              </div>
            )}

            {mode === "suggest" && showSuggestForm && (
              <div className="panel overflow-hidden rounded-[2rem]">
                <div className="border-b border-border px-6 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">Open suggestion</p>
                </div>

                <div className="space-y-4 p-6">
                  <Input
                    type="text"
                    placeholder="Suggestion title"
                    value={suggestTitle}
                    onChange={(e) => setSuggestTitle(e.target.value)}
                  />
                  <textarea
                    placeholder="Why should this change exist?"
                    value={suggestDesc}
                    onChange={(e) => setSuggestDesc(e.target.value)}
                    rows={5}
                    className="w-full resize-none rounded-[1.2rem] border border-border bg-surface px-4 py-3.5 text-sm text-foreground shadow-[0_18px_36px_-28px_var(--shadow-color)] placeholder:text-foreground-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/12"
                  />

                  <div className="rounded-[1.3rem] border border-border bg-surface-2/70 px-5 py-4 text-sm leading-7 text-foreground-2">
                    Reviewers will see the diff, rationale, and comment thread before the source document changes.
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button variant="ghost" size="md" onClick={() => setShowSuggestForm(false)} className="flex-1 gap-2">
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      size="md"
                      onClick={handleSubmitSuggestion}
                      loading={submitting}
                      disabled={!suggestTitle.trim()}
                      className="flex-1 gap-2"
                    >
                      <GitPullRequest className="h-4 w-4" />
                      Submit
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="panel overflow-hidden rounded-[2rem]">
              <div className="border-b border-border px-6 py-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
                    <GitPullRequest className="h-3.5 w-3.5" />
                    Suggestions
                  </p>
                  <Badge variant="warning">{openSuggestions} open</Badge>
                </div>
              </div>

              <div className="divide-y divide-border">
                {suggestions.length === 0 ? (
                  <div className="px-6 py-6 text-sm leading-7 text-foreground-2">
                    No suggestions yet. Use suggest mode to start the first review thread.
                  </div>
                ) : (
                  suggestions.map((suggestion) => (
                    <Link
                      key={suggestion.id}
                      href={`/dashboard/docs/${docId}/suggestions/${suggestion.id}`}
                      className="block px-6 py-5 transition-colors hover:bg-surface-2/45"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{suggestion.title}</p>
                          {suggestion.description && (
                            <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-foreground-2">{suggestion.description}</p>
                          )}
                          <p className="mt-2 text-xs text-foreground-3">
                            {authorLabel(suggestion.created_by)} opened {formatRelativeTime(suggestion.created_at)} · {suggestion.comments} comments
                          </p>
                        </div>
                        <Badge
                          variant={
                            suggestion.status === "open" ? "warning" : suggestion.status === "merged" ? "success" : "danger"
                          }
                        >
                          {suggestion.status}
                        </Badge>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {mode === "read" && doc && (
              <div className="panel overflow-hidden rounded-[2rem]">
                <div className="border-b border-border px-6 py-5">
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-red-500">
                    <FileWarning className="h-3.5 w-3.5" />
                    Danger zone
                  </p>
                </div>

                <div className="space-y-4 p-6">
                  <p className="text-sm leading-7 text-foreground-2">
                    Only the document owner can remove this PRD. Deleting it will also remove its versions, suggestions, reviews,
                    and comments.
                  </p>

                  <div className="rounded-[1.3rem] border border-red-500/20 bg-red-500/8 p-4">
                    <p className="text-sm font-medium text-foreground">Delete document</p>
                    <p className="mt-2 text-sm leading-7 text-foreground-2">
                      Type <span className="font-semibold text-foreground">{doc.title}</span> to confirm permanent deletion.
                    </p>
                  </div>

                  <Input
                    type="text"
                    placeholder="Type the document title to confirm"
                    value={deleteConfirmTitle}
                    onChange={(e) => setDeleteConfirmTitle(e.target.value)}
                  />

                  <Button
                    variant="danger"
                    size="md"
                    className="w-full gap-2"
                    onClick={handleDeleteDocument}
                    loading={deleting}
                    disabled={deleteConfirmTitle.trim() !== doc.title}
                  >
                    <FileWarning className="h-4 w-4" />
                    Delete document
                  </Button>
                </div>
              </div>
            )}
          </aside>
        </section>
      )}
    </div>
  );
}
