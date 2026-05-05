"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronLeft,
  Clock,
  Eye,
  GitPullRequest,
  History,
  Loader2,
  PenLine,
  Plus,
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
    title: "Current document",
    description: "Edit the canonical spec, save snapshots, and run contradiction checks as the source evolves.",
  },
  suggest: {
    title: "Suggestion draft",
    description: "Prepare a reviewable change instead of rewriting the source silently.",
  },
  history: {
    title: "Version history",
    description: "Move through saved states and inspect what the product team believed at each step.",
  },
};

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
          const c = docData.currentVersion.content as object;
          setCurrentContent(c);
          setSuggestContent(c);
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
      <div className="space-y-4 px-1 pb-1">
        <section className="panel rounded-[2.3rem] p-5 lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
                  className="mt-2 w-full bg-transparent text-3xl font-semibold tracking-[-0.05em] text-foreground placeholder:text-foreground-3 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>
            <Button size="lg" onClick={handleSaveNew} loading={saving} className="gap-2">
              <Save className="h-4 w-4" />
              Save document
            </Button>
          </div>
        </section>

        <div className="panel rounded-[2.3rem] p-2 lg:p-3">
          <DocEditor content={null} editable onChange={setCurrentContent} placeholder="Start writing your PRD..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-1 pb-1">
      <section className="panel rounded-[2.3rem] p-5 lg:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mt-1 gap-1.5">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">{MODE_LABELS[mode].title}</p>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  className="mt-2 w-full bg-transparent text-3xl font-semibold tracking-[-0.05em] text-foreground focus:outline-none"
                />
                <p className="mt-2 max-w-3xl text-sm leading-7 text-foreground-2">{MODE_LABELS[mode].description}</p>
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-3 lg:items-end">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">v{doc?.current_version_number ?? 1}</Badge>
                <Badge variant="warning">{openSuggestions} open</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {mode === "read" && (
                  <Button variant="secondary" size="md" onClick={handleSaveVersion} loading={saving} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save version
                  </Button>
                )}
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
        </div>
      </section>

      {mode === "history" ? (
        <section className="grid gap-4 xl:grid-cols-[320px_1fr]">
          <aside className="panel rounded-[2.1rem] p-4">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">Versions</p>
            <div className="mt-4 space-y-2">
              {versions.length === 0 && <p className="px-2 text-xs text-foreground-3">No versions yet.</p>}
              {versions.map((version) => (
                <button
                  key={version.id}
                  onClick={() => setSelectedVersion(version)}
                  className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition-all ${
                    selectedVersion?.id === version.id
                      ? "border-indigo-500/25 bg-indigo-500/10"
                      : "border-border bg-surface-2/60 hover:bg-surface-2"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-foreground">v{version.version_number}</span>
                    {version.id === versions[0]?.id && <Badge variant="success">Current</Badge>}
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-foreground-3">
                    <Clock className="h-3.5 w-3.5" />
                    {formatRelativeTime(version.created_at)}
                  </p>
                  {version.ai_summary && (
                    <p className="mt-3 flex items-start gap-2 text-xs leading-6 text-foreground-2">
                      <Sparkles className="mt-1 h-3.5 w-3.5 shrink-0 text-indigo-500" />
                      {version.ai_summary}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </aside>

          <div className="space-y-4">
            {selectedVersion?.ai_summary && (
              <div className="panel-soft rounded-[1.8rem] px-5 py-4">
                <p className="flex items-start gap-2 text-sm leading-7 text-foreground-2">
                  <Sparkles className="mt-1 h-4 w-4 shrink-0 text-indigo-500" />
                  <span>
                    <span className="font-semibold text-foreground">AI changelog:</span> {selectedVersion.ai_summary}
                  </span>
                </p>
              </div>
            )}

            <div className="panel rounded-[2.1rem] p-2 lg:p-3">
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
        <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            {mode === "suggest" && !showSuggestForm && (
              <div className="panel-soft flex flex-col gap-4 rounded-[1.8rem] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Suggest mode</p>
                  <p className="mt-1 text-sm leading-7 text-foreground-2">
                    Your edits stay reviewable. When the draft is ready, open the submission panel and package the change as a suggestion.
                  </p>
                </div>
                <Button size="md" onClick={() => setShowSuggestForm(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Review and submit
                </Button>
              </div>
            )}

            <div className="panel rounded-[2.1rem] p-2 lg:p-3">
              {mode === "read" && <DocEditor content={currentContent} editable onChange={handleContentChange} />}

              {mode === "suggest" &&
                (showSuggestForm ? (
                  <div className="space-y-4 p-3 lg:p-4">
                    <div className="px-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">Preview changes</p>
                      <p className="mt-2 text-sm leading-7 text-foreground-2">
                        Compare the draft against the current source before publishing it to reviewers.
                      </p>
                    </div>
                    <div className="panel-soft overflow-hidden rounded-[1.9rem]">
                      <DiffView oldText={currentText} newText={suggestText} />
                    </div>
                  </div>
                ) : (
                  <DocEditor content={suggestContent} editable onChange={setSuggestContent} />
                ))}
            </div>
          </div>

          <aside className="space-y-4">
            {mode === "read" && (
              <div className="panel rounded-[2rem] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    AI checks
                  </p>
                  {checkingContradictions ? (
                    <Loader2 className="h-4 w-4 animate-spin text-foreground-3" />
                  ) : contradictions.length === 0 ? (
                    <Badge variant="success">Clean</Badge>
                  ) : (
                    <Badge variant="warning">{contradictions.length}</Badge>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  {contradictions.length > 0 ? (
                    contradictions.map((contradiction, index) => (
                      <div key={index} className="rounded-[1.45rem] border border-amber-500/20 bg-amber-500/8 p-4">
                        <p className="flex items-start gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                          {contradiction.issue}
                        </p>
                        <p className="mt-2 text-xs leading-6 text-foreground-2">
                          “{contradiction.section1}” vs “{contradiction.section2}”
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm leading-7 text-foreground-2">
                      Contradiction checks run automatically while the current version changes.
                    </p>
                  )}
                </div>
              </div>
            )}

            {mode === "suggest" && showSuggestForm && (
              <div className="panel rounded-[2rem] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">Submit suggestion</p>
                <div className="mt-4 space-y-4">
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
                    className="w-full resize-none rounded-[1.2rem] border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-[0_18px_36px_-28px_var(--shadow-color)] placeholder:text-foreground-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/12"
                  />

                  <div className="rounded-[1.4rem] border border-border bg-surface-2/70 p-4 text-sm leading-7 text-foreground-2">
                    Reviewers will see the diff, your title, your rationale, and any discussion tied to this change.
                  </div>

                  <div className="flex gap-2">
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

            <div className="panel rounded-[2rem] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
                  <GitPullRequest className="h-3.5 w-3.5" />
                  Suggestions
                </p>
                <Badge variant="warning">{openSuggestions} open</Badge>
              </div>

              <div className="mt-4 space-y-3">
                {suggestions.length === 0 ? (
                  <p className="text-sm leading-7 text-foreground-2">No suggestions yet. Use suggest mode to start the first review thread.</p>
                ) : (
                  suggestions.map((suggestion) => (
                    <Link
                      key={suggestion.id}
                      href={`/dashboard/docs/${docId}/suggestions/${suggestion.id}`}
                      className="block rounded-[1.5rem] border border-border bg-surface-2/70 p-4 transition-all hover:-translate-y-0.5 hover:bg-surface-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold leading-6 text-foreground">{suggestion.title}</p>
                        <Badge
                          variant={
                            suggestion.status === "open" ? "warning" : suggestion.status === "merged" ? "success" : "danger"
                          }
                        >
                          {suggestion.status}
                        </Badge>
                      </div>
                      {suggestion.description && (
                        <p className="mt-2 text-sm leading-6 text-foreground-2 line-clamp-2">{suggestion.description}</p>
                      )}
                      <p className="mt-3 text-xs text-foreground-3">
                        {suggestion.created_by.slice(0, 8)} · {suggestion.comments} comments · {formatRelativeTime(suggestion.created_at)}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </aside>
        </section>
      )}
    </div>
  );
}
