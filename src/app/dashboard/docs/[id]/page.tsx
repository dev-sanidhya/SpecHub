"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  GitPullRequest, History, Save, Eye, PenLine, ChevronLeft,
  Sparkles, Plus, Check, X, MessageSquare, Clock, Loader2,
  AlertTriangle, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DocEditor } from "@/components/editor/DocEditor";
import { DiffView, jsonToText } from "@/components/diff/DiffView";
import { formatRelativeTime } from "@/lib/utils";

type Mode = "read" | "suggest" | "history";
type SuggestionStatus = "open" | "approved" | "rejected" | "merged";

interface Contradiction { section1: string; section2: string; issue: string; }
interface Version {
  id: string; version_number: number; ai_summary: string | null;
  created_by: string; created_at: string; content?: object;
}
interface Suggestion {
  id: string; title: string; description: string | null;
  status: SuggestionStatus; created_by: string; created_at: string; comments: number;
}
interface Doc {
  id: string; title: string; current_version_id: string | null;
  current_version_number: number; currentVersion?: { content: object };
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
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [selectedVersionContent, setSelectedVersionContent] = useState<object | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [workspace, setWorkspace] = useState<{ id: string } | null>(null);
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [checkingContradictions, setCheckingContradictions] = useState(false);
  const contradictionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { fetch("/api/workspace").then((r) => r.json()).then(setWorkspace); }, []);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/documents/${docId}`).then((r) => r.json()),
      fetch(`/api/documents/${docId}/versions`).then((r) => r.json()),
      fetch(`/api/documents/${docId}/suggestions`).then((r) => r.json()),
    ]).then(([docData, versionsData, suggestionsData]) => {
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
    }).catch(console.error).finally(() => setLoading(false));
  }, [docId, isNew]);

  useEffect(() => {
    if (!selectedVersion) return;
    if (doc && selectedVersion.id === doc.current_version_id) {
      setSelectedVersionContent(currentContent); return;
    }
    fetch(`/api/documents/${docId}/versions/${selectedVersion.id}`)
      .then((r) => r.json()).then((v) => setSelectedVersionContent(v.content ?? null))
      .catch(console.error);
  }, [selectedVersion, doc, currentContent, docId]);

  const runContradictionCheck = useCallback((content: object) => {
    if (contradictionTimer.current) clearTimeout(contradictionTimer.current);
    contradictionTimer.current = setTimeout(async () => {
      setCheckingContradictions(true);
      try {
        const res = await fetch(`/api/documents/${docId}/check`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        const data = await res.json();
        setContradictions(data.contradictions ?? []);
      } catch { /* silent fail */ }
      finally { setCheckingContradictions(false); }
    }, 3000);
  }, [docId]);

  const handleContentChange = useCallback((content: object) => {
    setCurrentContent(content);
    if (!isNew && mode === "read") runContradictionCheck(content);
  }, [isNew, mode, runContradictionCheck]);

  const handleSaveNew = useCallback(async () => {
    if (!workspace) return;
    setSaving(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspace.id, title: title || "Untitled" }),
      });
      const newDoc = await res.json();
      await fetch(`/api/documents/${newDoc.id}/versions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: currentContent }),
      });
      router.push(`/dashboard/docs/${newDoc.id}`);
    } finally { setSaving(false); }
  }, [workspace, title, currentContent, router]);

  const handleSaveVersion = useCallback(async () => {
    if (!doc) return;
    setSaving(true);
    try {
      await fetch(`/api/documents/${docId}/versions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: currentContent }),
      });
      const [updated, updatedVersions] = await Promise.all([
        fetch(`/api/documents/${docId}`).then((r) => r.json()),
        fetch(`/api/documents/${docId}/versions`).then((r) => r.json()),
      ]);
      setDoc(updated);
      setVersions(updatedVersions);
      if (updatedVersions.length > 0) setSelectedVersion(updatedVersions[0]);
    } finally { setSaving(false); }
  }, [doc, docId, currentContent]);

  const handleTitleBlur = useCallback(async () => {
    if (!doc || title === doc.title) return;
    await fetch(`/api/documents/${docId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  }, [doc, docId, title]);

  const handleSubmitSuggestion = useCallback(async () => {
    if (!suggestTitle.trim() || !doc?.current_version_id) return;
    setSubmitting(true);
    try {
      await fetch(`/api/documents/${docId}/suggestions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: suggestTitle, description: suggestDesc || null,
          proposed_content: suggestContent, base_version_id: doc.current_version_id,
        }),
      });
      setSuggestions(await fetch(`/api/documents/${docId}/suggestions`).then((r) => r.json()));
      setMode("read");
      setShowSuggestForm(false);
      setSuggestTitle(""); setSuggestDesc("");
    } finally { setSubmitting(false); }
  }, [suggestTitle, suggestDesc, suggestContent, doc, docId]);

  const currentText = jsonToText(currentContent);
  const suggestText = jsonToText(suggestContent);

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-6 h-6 text-border-3 animate-spin" /></div>;
  }

  if (isNew) {
    return (
      <div className="flex h-screen flex-col">
        <div className="flex items-center justify-between border-b border-border bg-background/80 px-4 py-4 backdrop-blur-xl lg:px-6 shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <Link href="/dashboard"><Button variant="ghost" size="sm" className="gap-1.5"><ChevronLeft className="w-4 h-4" />Back</Button></Link>
            <input type="text" placeholder="Untitled document" value={title} onChange={(e) => setTitle(e.target.value)}
              className="flex-1 bg-transparent text-lg font-semibold tracking-tight text-foreground placeholder:text-border-3 focus:outline-none" autoFocus />
          </div>
          <Button size="sm" onClick={handleSaveNew} loading={saving} className="gap-1.5"><Save className="w-4 h-4" />Save</Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <DocEditor content={null} editable onChange={setCurrentContent} placeholder="Start writing your PRD..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-background/80 px-4 py-4 backdrop-blur-xl lg:px-6 shrink-0">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard"><Button variant="ghost" size="sm" className="gap-1.5"><ChevronLeft className="w-4 h-4" />Back</Button></Link>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={handleTitleBlur}
            className="min-w-0 truncate bg-transparent text-lg font-semibold tracking-tight text-foreground focus:outline-none" />
          <Badge variant="default">v{doc?.current_version_number ?? 1}</Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {mode === "read" && (
            <Button variant="secondary" size="sm" onClick={handleSaveVersion} loading={saving} className="gap-1.5">
              <Save className="w-4 h-4" />Save version
            </Button>
          )}
          <div className="flex items-center bg-surface-2 border border-border-2 rounded-lg p-0.5">
            {(["read", "suggest", "history"] as Mode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                  mode === m ? "bg-surface-3 text-foreground" : "text-foreground-3 hover:text-foreground-2"
                }`}
              >
                {m === "read" && <Eye className="w-3.5 h-3.5" />}
                {m === "suggest" && <PenLine className="w-3.5 h-3.5" />}
                {m === "history" && <History className="w-3.5 h-3.5" />}
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-auto">

          {mode === "read" && (
            <DocEditor content={currentContent} editable onChange={handleContentChange} />
          )}

          {mode === "suggest" && (
            <div className="flex flex-col h-full">
              {showSuggestForm ? (
                <>
                  <div className="flex-1 overflow-auto px-4 py-4 lg:px-6">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-foreground-3">Preview changes</p>
                    <div className="panel overflow-hidden rounded-[1.5rem]">
                      <DiffView oldText={currentText} newText={suggestText} />
                    </div>
                  </div>
                  <div className="space-y-3 border-t border-border bg-surface px-4 py-4 lg:px-6">
                    <input type="text" placeholder="Suggestion title (required)" value={suggestTitle}
                      onChange={(e) => setSuggestTitle(e.target.value)}
                      className="h-11 w-full rounded-2xl border border-border bg-surface-2 px-4 text-sm text-foreground placeholder:text-foreground-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/12"
                    />
                    <textarea placeholder="Why this change? (optional)" value={suggestDesc}
                      onChange={(e) => setSuggestDesc(e.target.value)} rows={2}
                      className="w-full resize-none rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-foreground placeholder:text-foreground-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/12"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setShowSuggestForm(false)}><X className="w-4 h-4" />Cancel</Button>
                      <Button size="sm" onClick={handleSubmitSuggestion} loading={submitting} disabled={!suggestTitle.trim()} className="gap-1.5">
                        <GitPullRequest className="w-4 h-4" />Submit suggestion
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:px-6">
                    <p className="flex items-center gap-1.5 text-xs text-amber-500">
                      <PenLine className="w-3 h-3" />Suggest mode - your changes will be reviewed before merging
                    </p>
                    <Button size="sm" onClick={() => setShowSuggestForm(true)} className="gap-1.5">
                      <Plus className="w-3.5 h-3.5" />Review & submit
                    </Button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <DocEditor content={suggestContent} editable onChange={setSuggestContent} />
                  </div>
                </>
              )}
            </div>
          )}

          {mode === "history" && (
            <div className="flex flex-1 overflow-hidden">
              <div className="w-64 shrink-0 border-r border-border overflow-auto p-3 space-y-1">
                <p className="text-xs text-foreground-3 font-medium uppercase tracking-wide px-2 py-1">Versions</p>
                {versions.length === 0 && <p className="text-xs text-foreground-3 px-2">No versions yet.</p>}
                {versions.map((v) => (
                  <button key={v.id} onClick={() => setSelectedVersion(v)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      selectedVersion?.id === v.id
                        ? "bg-indigo-500/10 border border-indigo-500/20"
                        : "hover:bg-surface-2 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-medium text-foreground">v{v.version_number}</span>
                      {v.id === versions[0]?.id && <Badge variant="success" className="text-[10px] py-0">current</Badge>}
                    </div>
                    <p className="text-xs text-foreground-3 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{formatRelativeTime(v.created_at)}
                    </p>
                    {v.ai_summary && (
                      <p className="text-[10px] text-indigo-500 mt-1 line-clamp-2 flex items-start gap-1">
                        <Sparkles className="w-2.5 h-2.5 shrink-0 mt-0.5" />{v.ai_summary}
                      </p>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-auto flex flex-col">
                {selectedVersion?.ai_summary && (
                  <div className="px-6 py-3 border-b border-border bg-indigo-500/5 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-indigo-500 leading-relaxed">
                      <span className="font-semibold">AI changelog - </span>{selectedVersion.ai_summary}
                    </p>
                  </div>
                )}
                {selectedVersionContent
                  ? <DocEditor content={selectedVersionContent} editable={false} />
                  : <div className="flex items-center justify-center flex-1"><Loader2 className="w-5 h-5 text-border-3 animate-spin" /></div>
                }
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        {mode !== "history" && (
            <div className="flex w-80 shrink-0 flex-col overflow-auto border-l border-border bg-surface/80 backdrop-blur-xl">

            {/* Contradiction detection panel */}
            {mode === "read" && (
              <div className="border-b border-border">
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />AI Checks
                  </span>
                  {checkingContradictions && <Loader2 className="w-3 h-3 text-foreground-3 animate-spin" />}
                  {!checkingContradictions && contradictions.length === 0 && (
                    <span className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Check className="w-3 h-3" />Clean
                    </span>
                  )}
                  {!checkingContradictions && contradictions.length > 0 && <Badge variant="warning">{contradictions.length}</Badge>}
                </div>
                {contradictions.length > 0 && (
                  <div className="space-y-2 px-3 pb-3">
                    {contradictions.map((c, i) => (
                      <div key={i} className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-3">
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1 flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />{c.issue}
                        </p>
                        <p className="text-[10px] text-foreground-3 leading-relaxed">
                          <span className="text-foreground-2">&ldquo;{c.section1}&rdquo;</span>
                          {" vs "}
                          <span className="text-foreground-2">&ldquo;{c.section2}&rdquo;</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {!checkingContradictions && contradictions.length === 0 && (
                  <p className="px-4 pb-3 text-[10px] text-foreground-3">Checks run automatically as you edit.</p>
                )}
              </div>
            )}

            {/* Suggestions panel */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-indigo-500" />Suggestions
              </span>
              <Badge variant="warning">{suggestions.filter((s) => s.status === "open").length} open</Badge>
            </div>

            <div className="flex-1 p-3 space-y-2">
              {suggestions.length === 0 ? (
                <p className="text-xs text-foreground-3 text-center py-8">No suggestions yet</p>
              ) : (
                suggestions.map((s) => (
                  <Link key={s.id} href={`/dashboard/docs/${docId}/suggestions/${s.id}`}
                    className="block rounded-2xl border border-border bg-surface-2 p-3 transition-all hover:border-border-2 hover:bg-surface-3"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-sm font-medium text-foreground leading-tight">{s.title}</span>
                      <Badge variant={s.status === "open" ? "warning" : s.status === "merged" ? "success" : "danger"} className="shrink-0 text-[10px]">
                        {s.status === "merged" && <Check className="w-2.5 h-2.5" />}
                        {s.status === "rejected" && <X className="w-2.5 h-2.5" />}
                        {s.status}
                      </Badge>
                    </div>
                    {s.description && <p className="text-xs text-foreground-3 line-clamp-2 mb-2">{s.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-foreground-3">
                      <span>{s.created_by.slice(0, 8)}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{s.comments}</span>
                      <span>{formatRelativeTime(s.created_at)}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
