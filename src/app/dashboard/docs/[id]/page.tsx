"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  ChevronLeft,
  Clock,
  Download,
  Eye,
  GitBranchPlus,
  GitCompareArrows,
  GitPullRequest,
  History,
  Lock,
  Loader2,
  PenLine,
  Save,
  ShieldAlert,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DocEditor } from "@/components/editor/DocEditor";
import { DiffView, jsonToText } from "@/components/diff/DiffView";
import { Input } from "@/components/ui/Input";
import { UserChip } from "@/components/UserChip";
import { formatRelativeTime } from "@/lib/utils";
import { TEMPLATES, type Template } from "@/lib/templates";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useDocPresence } from "@/hooks/useDocPresence";

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


export default function DocPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;
  const isNew = docId === "new";

  const [mode, setMode] = useState<Mode>("read");
  const [templateStage, setTemplateStage] = useState<"pick" | "editing">(isNew ? "pick" : "editing");
  const [doc, setDoc] = useState<Doc | null>(null);
  const [title, setTitle] = useState("Untitled");
  const [currentContent, setCurrentContent] = useState<object>({ type: "doc", content: [] });
  const [suggestContent, setSuggestContent] = useState<object>({ type: "doc", content: [] });
  const [suggestTitle, setSuggestTitle] = useState("");
  const [suggestDesc, setSuggestDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [showLockWarning, setShowLockWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuggestForm, setShowSuggestForm] = useState(false);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState("");
  const [deleting, setDeleting] = useState(false);
  // Version comparison
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState<Version | null>(null);
  const [compareB, setCompareB] = useState<Version | null>(null);
  const [compareAContent, setCompareAContent] = useState<object | null>(null);
  const [compareBContent, setCompareBContent] = useState<object | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [selectedVersionContent, setSelectedVersionContent] = useState<object | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const { activeWorkspace: workspace } = useWorkspace();
  const viewers = useDocPresence(isNew ? null : docId);
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [checkingContradictions, setCheckingContradictions] = useState(false);
  const contradictionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [hasDraftToRestore, setHasDraftToRestore] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftKey = isNew ? "spechub:draft:new" : `spechub:draft:${docId}`;

  // workspace is now provided by WorkspaceContext via useWorkspace()

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

  // On mount: check if a saved draft exists and is newer than the loaded content
  useEffect(() => {
    if (loading) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as { title?: string; content: object; savedAt: string };
      const savedAt = new Date(saved.savedAt);
      // Show restore prompt if the draft is less than 24 hours old
      const ageMs = Date.now() - savedAt.getTime();
      if (ageMs < 24 * 60 * 60 * 1000) setHasDraftToRestore(true);
    } catch {
      // Corrupt draft - ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Autosave current content to localStorage after 5 seconds of inactivity
  useEffect(() => {
    if (isNew || loading) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({ title, content: currentContent, savedAt: new Date().toISOString() })
        );
      } catch {
        // Storage quota exceeded or unavailable - silent fail
      }
    }, 5000);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  // We intentionally only re-run when content or title changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentContent, title]);

  // Will be wired after handleSaveNew/handleSaveVersion are declared (see cmdSaveRef below)
  const cmdSaveRef = useRef<() => void>(() => {});

  // Load content for version comparison
  useEffect(() => {
    if (!compareA || !docId) return;
    fetch(`/api/documents/${docId}/versions/${compareA.id}`)
      .then((r) => r.json())
      .then((v) => setCompareAContent(v.content ?? null))
      .catch(() => setCompareAContent(null));
  }, [compareA, docId]);

  useEffect(() => {
    if (!compareB || !docId) return;
    fetch(`/api/documents/${docId}/versions/${compareB.id}`)
      .then((r) => r.json())
      .then((v) => setCompareBContent(v.content ?? null))
      .catch(() => setCompareBContent(null));
  }, [compareB, docId]);

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as { title?: string; content: object; savedAt: string };
      if (saved.title) setTitle(saved.title);
      setCurrentContent(saved.content);
    } catch {
      // ignore
    } finally {
      setHasDraftToRestore(false);
    }
  }

  function discardDraft() {
    localStorage.removeItem(draftKey);
    setHasDraftToRestore(false);
  }

  const runContradictionCheck = useCallback(
    async (content: object) => {
      if (contradictionTimer.current) clearTimeout(contradictionTimer.current);
      setCheckingContradictions(true);
      try {
        const res = await fetch(`/api/documents/${docId}/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        const data = await res.json();
        setContradictions(data.contradictions ?? []);
        setLastCheckedAt(new Date());
      } catch {
        // silent fail
      } finally {
        setCheckingContradictions(false);
      }
    },
    [docId]
  );

  const handleContentChange = useCallback(
    (content: object) => {
      setCurrentContent(content);
    },
    []
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
      localStorage.removeItem(draftKey);
      setHasDraftToRestore(false);
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

  // Cmd+S / Ctrl+S - wired here so handleSaveNew/handleSaveVersion are in scope
  useEffect(() => {
    cmdSaveRef.current = () => {
      const openCount = suggestions.filter((s) => s.status === "open").length;
      if (isNew) {
        handleSaveNew();
      } else if (doc) {
        if (openCount > 0) {
          setShowLockWarning(true);
        } else {
          handleSaveVersion();
        }
      }
    };
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        cmdSaveRef.current();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

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

  const handleExport = useCallback(async () => {
    if (!doc) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/documents/${docId}/export`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : `${docId}.md`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent fail
    } finally {
      setExporting(false);
    }
  }, [doc, docId]);

  const handleExportPdf = useCallback(async () => {
    if (!doc) return;
    setExportingPdf(true);
    try {
      const res = await fetch(`/api/documents/${docId}/pdf`);
      if (!res.ok) throw new Error("PDF export failed");
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : `${docId}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent fail
    } finally {
      setExportingPdf(false);
    }
  }, [doc, docId]);

  const handleArchive = useCallback(async () => {
    if (!doc) return;
    setArchiving(true);
    try {
      await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      });
      router.push("/dashboard");
      router.refresh();
    } catch {
      setArchiving(false);
    }
  }, [doc, docId, router]);

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

  if (isNew && templateStage === "pick") {
    const handlePickTemplate = (template: Template | null) => {
      if (template) {
        setCurrentContent(template.content);
        setSuggestContent(template.content);
        setTitle(template.defaultTitle);
      }
      setTemplateStage("editing");
    };

    return (
      <div className="space-y-6 px-1 pb-6">
        <section className="panel overflow-hidden rounded-[2.2rem]">
          <div className="border-b border-border px-7 py-8 lg:px-8">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">New document</p>
                <p className="mt-1 text-sm text-foreground-2">Choose a template or start from scratch</p>
              </div>
            </div>
          </div>

          <div className="p-7 lg:p-8">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* Blank */}
              <button
                type="button"
                onClick={() => handlePickTemplate(null)}
                className="group flex flex-col gap-3 rounded-[1.6rem] border border-border bg-surface-2/50 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-indigo-500/30 hover:bg-indigo-500/5 hover:shadow-[0_16px_40px_-20px_rgba(99,102,241,0.18)]"
              >
                <span className="text-2xl">📄</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Blank document</p>
                  <p className="mt-1 text-xs text-foreground-3">Start with an empty editor</p>
                </div>
              </button>

              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handlePickTemplate(tpl)}
                  className="group flex flex-col gap-3 rounded-[1.6rem] border border-border bg-surface-2/50 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-indigo-500/30 hover:bg-indigo-500/5 hover:shadow-[0_16px_40px_-20px_rgba(99,102,241,0.18)]"
                >
                  <span className="text-2xl">{tpl.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{tpl.name}</p>
                    <p className="mt-1 text-xs text-foreground-3">{tpl.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (isNew) {
    return (
      <div className="space-y-6 px-1 pb-6">
        <section className="panel rounded-[2.2rem] px-6 py-7 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setTemplateStage("pick")}>
                <ChevronLeft className="h-4 w-4" />
                Templates
              </Button>
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
          <DocEditor content={currentContent} editable onChange={setCurrentContent} placeholder="Start writing your PRD..." />
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
                  <>
                    <Button variant="ghost" size="md" onClick={handleExport} loading={exporting} disabled={!doc?.current_version_id} className="gap-2">
                      <Download className="h-4 w-4" />
                      Markdown
                    </Button>
                    <Button variant="ghost" size="md" onClick={handleExportPdf} loading={exportingPdf} disabled={!doc?.current_version_id} className="gap-2">
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                    {openSuggestions > 0 && !showLockWarning ? (
                      <Button variant="secondary" size="md" onClick={() => setShowLockWarning(true)} className="gap-2">
                        <Lock className="h-4 w-4" />
                        Save version
                      </Button>
                    ) : showLockWarning ? (
                      <div className="flex items-center gap-2 rounded-[1.4rem] border border-amber-500/30 bg-amber-500/8 px-4 py-2">
                        <p className="text-xs text-amber-700 dark:text-amber-400">Save anyway? Open reviews will see a stale diff.</p>
                        <button type="button" onClick={() => setShowLockWarning(false)} className="text-xs text-foreground-3 hover:text-foreground">Cancel</button>
                        <Button size="sm" onClick={() => { setShowLockWarning(false); handleSaveVersion(); }} loading={saving} className="gap-1.5">
                          <Save className="h-3.5 w-3.5" />
                          Save
                        </Button>
                      </div>
                    ) : (
                      <Button variant="secondary" size="md" onClick={handleSaveVersion} loading={saving} className="gap-2">
                        <Save className="h-4 w-4" />
                        Save version
                      </Button>
                    )}
                  </>
                )}
                {mode === "suggest" && !showSuggestForm && (
                  <Button size="md" onClick={() => setShowSuggestForm(true)} className="gap-2">
                    <GitBranchPlus className="h-4 w-4" />
                    Open suggestion
                  </Button>
                )}
              </div>

              {viewers.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-foreground-3">
                    <Users className="h-3.5 w-3.5" />
                    {viewers.length} also viewing
                  </span>
                  <div className="flex -space-x-2">
                    {viewers.slice(0, 5).map((v) => (
                      <div
                        key={v.userId}
                        title={v.name}
                        className="h-7 w-7 shrink-0 overflow-hidden rounded-full border-2 border-surface bg-indigo-500/20"
                      >
                        {v.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={v.imageUrl} alt={v.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase text-indigo-500">
                            {v.name.slice(0, 1)}
                          </span>
                        )}
                      </div>
                    ))}
                    {viewers.length > 5 && (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-surface-3 text-[10px] font-semibold text-foreground-3">
                        +{viewers.length - 5}
                      </div>
                    )}
                  </div>
                </div>
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
            <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">Version timeline</p>
              <button
                type="button"
                onClick={() => {
                  setCompareMode((v) => !v);
                  setCompareA(null);
                  setCompareB(null);
                  setCompareAContent(null);
                  setCompareBContent(null);
                }}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  compareMode
                    ? "bg-indigo-500/15 text-indigo-500"
                    : "border border-border text-foreground-3 hover:text-foreground"
                }`}
              >
                <GitCompareArrows className="h-3.5 w-3.5" />
                Compare
              </button>
            </div>
            {compareMode && (
              <div className="border-b border-border bg-indigo-500/5 px-5 py-3">
                <p className="text-[11px] text-foreground-2">
                  {!compareA ? "Click a version to set the base" : !compareB ? "Now click the target version" : (
                    <span className="font-medium text-foreground">Comparing v{compareA.version_number} → v{compareB.version_number}</span>
                  )}
                </p>
              </div>
            )}
            <div className="space-y-2.5 p-4">
              {versions.length === 0 && <p className="px-2 py-2 text-xs text-foreground-3">No versions yet.</p>}
              {versions.map((version) => {
                const isA = compareA?.id === version.id;
                const isB = compareB?.id === version.id;
                const handleVersionClick = () => {
                  if (!compareMode) {
                    setSelectedVersion(version);
                  } else {
                    if (!compareA) { setCompareA(version); }
                    else if (!compareB && version.id !== compareA.id) { setCompareB(version); }
                    else { setCompareA(version); setCompareB(null); setCompareBContent(null); }
                  }
                };
                return (
                  <button
                    key={version.id}
                    onClick={handleVersionClick}
                    className={`w-full rounded-[1.35rem] border px-4 py-4 text-left transition-all ${
                      isA ? "border-indigo-500/40 bg-indigo-500/12 ring-1 ring-indigo-500/20"
                      : isB ? "border-green-500/40 bg-green-500/10 ring-1 ring-green-500/20"
                      : selectedVersion?.id === version.id && !compareMode
                        ? "border-indigo-500/25 bg-indigo-500/10"
                        : "border-border bg-surface-2/60 hover:bg-surface-2"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-foreground">v{version.version_number}</span>
                      <div className="flex items-center gap-1.5">
                        {isA && <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold text-indigo-500">BASE</span>}
                        {isB && <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold text-green-600 dark:text-green-400">TARGET</span>}
                        {version.id === versions[0]?.id && !isA && !isB && <Badge variant="success">Current</Badge>}
                      </div>
                    </div>
                    <p className="mt-2.5 flex items-center gap-1.5 text-xs text-foreground-3">
                      <Clock className="h-3.5 w-3.5" />
                      {formatRelativeTime(version.created_at)}
                    </p>
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-foreground-3">
                      <span>Saved by</span>
                      <UserChip userId={version.created_by} showYou />
                    </p>
                    {version.ai_summary && (
                      <p className="mt-3 flex items-start gap-2 text-xs leading-6 text-foreground-2">
                        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
                        {version.ai_summary}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="space-y-6">
            {compareMode && compareA && compareB ? (
              <div className="panel overflow-hidden rounded-[2rem]">
                <div className="border-b border-border px-6 py-5">
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
                    <GitCompareArrows className="h-3.5 w-3.5" />
                    v{compareA.version_number} → v{compareB.version_number}
                  </p>
                  <p className="mt-1.5 text-sm text-foreground-2">
                    Showing what changed between these two snapshots.
                  </p>
                </div>
                {compareAContent && compareBContent ? (
                  <DiffView oldText={jsonToText(compareAContent)} newText={jsonToText(compareBContent)} />
                ) : (
                  <div className="flex h-40 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-foreground-3" />
                  </div>
                )}
              </div>
            ) : compareMode ? (
              <div className="panel rounded-[2rem] flex h-48 items-center justify-center">
                <div className="text-center">
                  <GitCompareArrows className="mx-auto h-8 w-8 text-foreground-3" />
                  <p className="mt-3 text-sm text-foreground-2">
                    {!compareA ? "Select a base version on the left" : "Now select a target version"}
                  </p>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </section>
      ) : (
        <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            {hasDraftToRestore && mode === "read" && (
              <div className="flex items-center justify-between gap-4 rounded-[1.8rem] border border-indigo-500/25 bg-indigo-500/8 px-5 py-4">
                <p className="text-sm leading-7 text-foreground">
                  <span className="font-semibold">Unsaved draft found.</span>{" "}
                  <span className="text-foreground-2">You have a locally saved draft that was not committed as a version.</span>
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={discardDraft}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-foreground-2 transition-colors hover:bg-surface-2 hover:text-foreground"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={restoreDraft}
                    className="rounded-full bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-600"
                  >
                    Restore
                  </button>
                </div>
              </div>
            )}

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
                    <div className="flex items-center gap-2">
                      {checkingContradictions ? (
                        <Loader2 className="h-4 w-4 animate-spin text-foreground-3" />
                      ) : lastCheckedAt !== null ? (
                        contradictions.length === 0 ? (
                          <Badge variant="success">Passing</Badge>
                        ) : (
                          <Badge variant="warning">{contradictions.length} found</Badge>
                        )
                      ) : null}
                      <button
                        type="button"
                        onClick={() => runContradictionCheck(currentContent)}
                        disabled={checkingContradictions || isNew}
                        className="rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] font-semibold text-foreground-2 transition-colors hover:bg-surface-2 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {checkingContradictions ? "Running..." : "Run"}
                      </button>
                    </div>
                  </div>
                  {lastCheckedAt && (
                    <p className="mt-2 text-[11px] text-foreground-3">
                      Last checked {lastCheckedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>

                <div className="space-y-3 p-6">
                  {lastCheckedAt === null ? (
                    <p className="text-sm leading-7 text-foreground-2">
                      Click <span className="font-semibold text-foreground">Run</span> to scan this document for contradictions and conflicting statements.
                    </p>
                  ) : contradictions.length > 0 ? (
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
                      No contradictions found. The document looks internally consistent.
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
                          <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-foreground-3">
                            <UserChip userId={suggestion.created_by} showYou />
                            <span>opened {formatRelativeTime(suggestion.created_at)} · {suggestion.comments} comment{suggestion.comments === 1 ? "" : "s"}</span>
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
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground-3">
                    <Archive className="h-3.5 w-3.5" />
                    Document management
                  </p>
                </div>

                <div className="space-y-4 p-6">
                  <div className="rounded-[1.3rem] border border-border bg-surface-2/60 p-4">
                    <p className="text-sm font-medium text-foreground">Archive document</p>
                    <p className="mt-2 text-sm leading-7 text-foreground-2">
                      Removes it from the main list. History and suggestions are preserved and it can be accessed from the archived filter.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full gap-2"
                    onClick={handleArchive}
                    loading={archiving}
                  >
                    <Archive className="h-4 w-4" />
                    Archive document
                  </Button>

                  <div className="mt-2 rounded-[1.3rem] border border-red-500/20 bg-red-500/6 p-4">
                    <p className="text-sm font-medium text-foreground">Permanent deletion</p>
                    <p className="mt-2 text-sm leading-7 text-foreground-2">
                      Type <span className="font-semibold text-foreground">{doc.title}</span> to permanently delete all versions, suggestions, and comments.
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
                    Delete permanently
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
