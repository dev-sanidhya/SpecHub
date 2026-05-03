"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  GitPullRequest, History, Save, Eye, PenLine, ChevronLeft,
  Sparkles, Plus, Check, X, MessageSquare, Clock, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DocEditor } from "@/components/editor/DocEditor";
import { DiffView, jsonToText } from "@/components/diff/DiffView";
import { formatRelativeTime } from "@/lib/utils";

type Mode = "read" | "suggest" | "history";
type SuggestionStatus = "open" | "approved" | "rejected" | "merged";

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

  // Load workspace on mount (needed for new doc creation)
  useEffect(() => {
    fetch("/api/workspace").then((r) => r.json()).then(setWorkspace);
  }, []);

  // Load doc data
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
        setCurrentContent(docData.currentVersion.content as object);
        setSuggestContent(docData.currentVersion.content as object);
      }
      setVersions(versionsData);
      if (versionsData.length > 0) setSelectedVersion(versionsData[0]);
      setSuggestions(suggestionsData);
    }).catch(console.error).finally(() => setLoading(false));
  }, [docId, isNew]);

  // Load selected version content for history mode
  useEffect(() => {
    if (!selectedVersion) return;
    // Latest version content is already in doc.currentVersion
    if (doc && selectedVersion.id === doc.current_version_id) {
      setSelectedVersionContent(currentContent);
      return;
    }
    // Fetch older version content
    fetch(`/api/documents/${docId}/versions/${selectedVersion.id}`)
      .then((r) => r.json())
      .then((v) => setSelectedVersionContent(v.content ?? null))
      .catch(console.error);
  }, [selectedVersion, doc, currentContent, docId]);

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
      // Save the content as v1
      if (Object.keys(currentContent).length > 2) {
        await fetch(`/api/documents/${newDoc.id}/versions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: currentContent }),
        });
      }
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
      // Refresh doc
      const updated = await fetch(`/api/documents/${docId}`).then((r) => r.json());
      setDoc(updated);
      const updatedVersions = await fetch(`/api/documents/${docId}/versions`).then((r) => r.json());
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
      // Refresh suggestions
      const updated = await fetch(`/api/documents/${docId}/suggestions`).then((r) => r.json());
      setSuggestions(updated);
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
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 text-[#363640] animate-spin" />
      </div>
    );
  }

  if (isNew) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex items-center justify-between px-6 py-3 border-b border-[#1e1e24] bg-[#0e0e12] shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ChevronLeft className="w-4 h-4" />Back
              </Button>
            </Link>
            <input
              type="text"
              placeholder="Untitled document"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent text-[#f2f2f5] font-semibold text-base focus:outline-none placeholder:text-[#363640] flex-1"
              autoFocus
            />
          </div>
          <Button size="sm" onClick={handleSaveNew} loading={saving} className="gap-1.5">
            <Save className="w-4 h-4" />Save
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <DocEditor
            content={null}
            editable
            onChange={setCurrentContent}
            placeholder="Start writing your PRD..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#1e1e24] bg-[#0e0e12] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ChevronLeft className="w-4 h-4" />Back
            </Button>
          </Link>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="bg-transparent text-[#f2f2f5] font-semibold text-base focus:outline-none min-w-0 truncate"
          />
          <Badge variant="default">v{doc?.current_version_number ?? 1}</Badge>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {mode === "read" && (
            <Button variant="secondary" size="sm" onClick={handleSaveVersion} loading={saving} className="gap-1.5">
              <Save className="w-4 h-4" />Save version
            </Button>
          )}
          <div className="flex items-center bg-[#111114] border border-[#2a2a32] rounded-lg p-0.5">
            {(["read", "suggest", "history"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                  mode === m ? "bg-[#222228] text-[#f2f2f5]" : "text-[#606070] hover:text-[#a0a0b0]"
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
        <div className="flex-1 overflow-auto flex flex-col">

          {/* READ MODE */}
          {mode === "read" && (
            <DocEditor content={currentContent} editable onChange={setCurrentContent} />
          )}

          {/* SUGGEST MODE */}
          {mode === "suggest" && (
            <div className="flex flex-col h-full">
              {showSuggestForm ? (
                <>
                  <div className="flex-1 overflow-auto px-6 py-4">
                    <p className="text-xs text-[#606070] font-medium uppercase tracking-wide mb-3">Preview changes</p>
                    <div className="rounded-lg border border-[#2a2a32] bg-[#111114] overflow-hidden">
                      <DiffView oldText={currentText} newText={suggestText} />
                    </div>
                  </div>
                  <div className="border-t border-[#1e1e24] p-4 bg-[#0e0e12] space-y-3">
                    <input
                      type="text"
                      placeholder="Suggestion title (required)"
                      value={suggestTitle}
                      onChange={(e) => setSuggestTitle(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-[#18181c] border border-[#2a2a32] text-sm text-[#f2f2f5] placeholder:text-[#606070] focus:outline-none focus:border-indigo-500/40 transition-colors"
                    />
                    <textarea
                      placeholder="Why this change? (optional)"
                      value={suggestDesc}
                      onChange={(e) => setSuggestDesc(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-[#18181c] border border-[#2a2a32] text-sm text-[#f2f2f5] placeholder:text-[#606070] focus:outline-none focus:border-indigo-500/40 transition-colors resize-none"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setShowSuggestForm(false)}>
                        <X className="w-4 h-4" />Cancel
                      </Button>
                      <Button size="sm" onClick={handleSubmitSuggestion} loading={submitting} disabled={!suggestTitle.trim()} className="gap-1.5">
                        <GitPullRequest className="w-4 h-4" />Submit suggestion
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="px-4 py-2 border-b border-[#1e1e24] bg-[#0e0e12] flex items-center justify-between">
                    <p className="text-xs text-amber-400/80 flex items-center gap-1.5">
                      <PenLine className="w-3 h-3" />
                      Suggest mode - your changes will be reviewed before merging
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

          {/* HISTORY MODE */}
          {mode === "history" && (
            <div className="flex flex-1 overflow-hidden">
              <div className="w-64 shrink-0 border-r border-[#1e1e24] overflow-auto p-3 space-y-1">
                <p className="text-xs text-[#606070] font-medium uppercase tracking-wide px-2 py-1">Versions</p>
                {versions.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVersion(v)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      selectedVersion?.id === v.id
                        ? "bg-indigo-500/10 border border-indigo-500/20"
                        : "hover:bg-[#111114] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-medium text-[#f2f2f5]">v{v.version_number}</span>
                      {v.id === versions[0]?.id && (
                        <Badge variant="success" className="text-[10px] py-0">current</Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#606070] flex items-center gap-1">
                      <Clock className="w-3 h-3" />{formatRelativeTime(v.created_at)}
                    </p>
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-auto flex flex-col">
                {selectedVersion?.ai_summary && (
                  <div className="px-6 py-3 border-b border-[#1e1e24] bg-indigo-500/5 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-indigo-300 leading-relaxed">
                      <span className="font-semibold">AI changelog - </span>{selectedVersion.ai_summary}
                    </p>
                  </div>
                )}
                {selectedVersionContent ? (
                  <DocEditor content={selectedVersionContent} editable={false} />
                ) : (
                  <div className="flex items-center justify-center flex-1">
                    <Loader2 className="w-5 h-5 text-[#363640] animate-spin" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right panel: suggestions */}
        {mode !== "history" && (
          <div className="w-72 shrink-0 border-l border-[#1e1e24] bg-[#0e0e12] overflow-auto flex flex-col">
            <div className="px-4 py-3 border-b border-[#1e1e24] flex items-center justify-between">
              <span className="text-sm font-medium text-[#f2f2f5] flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-indigo-400" />Suggestions
              </span>
              <Badge variant="warning">
                {suggestions.filter((s) => s.status === "open").length} open
              </Badge>
            </div>

            <div className="flex-1 p-3 space-y-2">
              {suggestions.length === 0 ? (
                <p className="text-xs text-[#606070] text-center py-8">No suggestions yet</p>
              ) : (
                suggestions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/dashboard/docs/${docId}/suggestions/${s.id}`}
                    className="block p-3 rounded-lg border border-[#1e1e24] hover:border-[#2a2a32] bg-[#111114] hover:bg-[#13131a] transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-sm font-medium text-[#f2f2f5] leading-tight">{s.title}</span>
                      <Badge
                        variant={s.status === "open" ? "warning" : s.status === "merged" ? "success" : "danger"}
                        className="shrink-0 text-[10px]"
                      >
                        {s.status === "merged" && <Check className="w-2.5 h-2.5" />}
                        {s.status === "rejected" && <X className="w-2.5 h-2.5" />}
                        {s.status}
                      </Badge>
                    </div>
                    {s.description && (
                      <p className="text-xs text-[#606070] line-clamp-2 mb-2">{s.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-[#606070]">
                      <span>{s.created_by.slice(0, 8)}</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />{s.comments}
                      </span>
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
