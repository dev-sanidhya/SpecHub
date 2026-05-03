"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  GitPullRequest,
  History,
  Save,
  Eye,
  PenLine,
  ChevronLeft,
  Sparkles,
  Plus,
  Check,
  X,
  MessageSquare,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DocEditor } from "@/components/editor/DocEditor";
import { DiffView, jsonToText } from "@/components/diff/DiffView";
import { formatRelativeTime } from "@/lib/utils";

type Mode = "read" | "suggest" | "history";

// Demo version snapshots
const DEMO_VERSIONS = [
  {
    id: "v4",
    version_number: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    created_by: "Sanidhya",
    ai_summary:
      "Onboarding moved from blocking to optional. Email verification now async. Reduces signup friction by removing the 6-step gate.",
    content: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Authentication Flow PRD" }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Overview" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Users access the dashboard immediately after signup. Onboarding is optional and can be completed later.",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Requirements" }],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Google OAuth and GitHub OAuth supported" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", text: "Email verification runs async, does not block access" },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Session expires after 30 days of inactivity" }],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: "v3",
    version_number: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    created_by: "Sanidhya",
    ai_summary: "Initial auth spec with 6-step blocking onboarding. Email gate before dashboard access.",
    content: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Authentication Flow PRD" }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Overview" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Users must complete a 6-step onboarding before accessing the dashboard.",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Requirements" }],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Google OAuth and GitHub OAuth supported" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Email verification required before first login" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Session expires after 30 days of inactivity" }],
                },
              ],
            },
          ],
        },
      ],
    },
  },
];

type SuggestionStatus = "open" | "approved" | "rejected" | "merged";

const DEMO_SUGGESTIONS: {
  id: string;
  title: string;
  description: string;
  status: SuggestionStatus;
  created_by: string;
  created_at: string;
  comments: number;
}[] = [
  {
    id: "s1",
    title: "Add magic link auth option",
    description: "Some users prefer not to use OAuth. Adding magic link gives an alternative.",
    status: "open",
    created_by: "Priya",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    comments: 2,
  },
  {
    id: "s2",
    title: "Simplify auth onboarding",
    description: "Remove blocking steps, make onboarding optional.",
    status: "merged",
    created_by: "Sanidhya",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    comments: 4,
  },
];

export default function DocPage() {
  const params = useParams();
  const docId = params.id as string;
  const isNew = docId === "new";

  const [mode, setMode] = useState<Mode>("read");
  const [title, setTitle] = useState(isNew ? "" : "Authentication Flow PRD");
  const [currentContent, setCurrentContent] = useState<object>(DEMO_VERSIONS[0].content);
  const [suggestContent, setSuggestContent] = useState<object>(DEMO_VERSIONS[0].content);
  const [suggestTitle, setSuggestTitle] = useState("");
  const [suggestDesc, setSuggestDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(DEMO_VERSIONS[0]);
  const [showSuggestForm, setShowSuggestForm] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
  }, []);

  const handleSubmitSuggestion = useCallback(async () => {
    if (!suggestTitle.trim()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitting(false);
    setMode("read");
    setShowSuggestForm(false);
    setSuggestTitle("");
    setSuggestDesc("");
  }, [suggestTitle]);

  const currentText = jsonToText(currentContent);
  const suggestText = jsonToText(suggestContent);

  if (isNew) {
    return (
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-[#1e1e24] bg-[#0e0e12] shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ChevronLeft className="w-4 h-4" />
                Back
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
          <Button size="sm" onClick={handleSave} loading={saving} className="gap-1.5">
            <Save className="w-4 h-4" />
            Save
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <DocEditor
            content={null}
            editable
            onChange={setCurrentContent}
            placeholder="Start writing your PRD... Add an overview, requirements, user stories, and acceptance criteria."
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
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-[#f2f2f5] font-semibold text-base truncate">{title}</h1>
          </div>
          <Badge variant="default">v{DEMO_VERSIONS[0].version_number}</Badge>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Mode toggle */}
          <div className="flex items-center bg-[#111114] border border-[#2a2a32] rounded-lg p-0.5">
            <button
              onClick={() => setMode("read")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mode === "read"
                  ? "bg-[#222228] text-[#f2f2f5]"
                  : "text-[#606070] hover:text-[#a0a0b0]"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Read
            </button>
            <button
              onClick={() => setMode("suggest")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mode === "suggest"
                  ? "bg-[#222228] text-[#f2f2f5]"
                  : "text-[#606070] hover:text-[#a0a0b0]"
              }`}
            >
              <PenLine className="w-3.5 h-3.5" />
              Suggest
            </button>
            <button
              onClick={() => setMode("history")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mode === "history"
                  ? "bg-[#222228] text-[#f2f2f5]"
                  : "text-[#606070] hover:text-[#a0a0b0]"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              History
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor / Diff panel */}
        <div className="flex-1 overflow-auto flex flex-col">
          {mode === "read" && (
            <DocEditor content={currentContent} editable={false} />
          )}

          {mode === "suggest" && (
            <div className="flex flex-col h-full">
              {showSuggestForm ? (
                <>
                  {/* Diff preview */}
                  <div className="flex-1 overflow-auto">
                    <div className="px-6 py-4 border-b border-[#1e1e24]">
                      <p className="text-xs text-[#606070] mb-2 font-medium uppercase tracking-wide">
                        Preview changes
                      </p>
                      <DiffView oldText={currentText} newText={suggestText} />
                    </div>
                  </div>

                  {/* Suggestion form */}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSuggestForm(false)}
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSubmitSuggestion}
                        loading={submitting}
                        disabled={!suggestTitle.trim()}
                        className="gap-1.5"
                      >
                        <GitPullRequest className="w-4 h-4" />
                        Submit suggestion
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
                    <Button
                      size="sm"
                      onClick={() => setShowSuggestForm(true)}
                      className="gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Review & submit
                    </Button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <DocEditor
                      content={suggestContent}
                      editable
                      onChange={setSuggestContent}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {mode === "history" && (
            <div className="flex flex-1 overflow-hidden">
              {/* Version timeline */}
              <div className="w-64 shrink-0 border-r border-[#1e1e24] overflow-auto p-3 space-y-1">
                <p className="text-xs text-[#606070] font-medium uppercase tracking-wide px-2 py-1">
                  Versions
                </p>
                {DEMO_VERSIONS.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVersion(v)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      selectedVersion.id === v.id
                        ? "bg-indigo-500/10 border border-indigo-500/20"
                        : "hover:bg-[#111114] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-medium text-[#f2f2f5]">
                        v{v.version_number}
                      </span>
                      {v.id === DEMO_VERSIONS[0].id && (
                        <Badge variant="success" className="text-[10px] py-0">
                          current
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#606070] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(v.created_at)}
                    </p>
                  </button>
                ))}
              </div>

              {/* Version detail */}
              <div className="flex-1 overflow-auto flex flex-col">
                {selectedVersion.ai_summary && (
                  <div className="px-6 py-3 border-b border-[#1e1e24] bg-indigo-500/5 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-indigo-300 leading-relaxed">
                      <span className="font-semibold">AI changelog - </span>
                      {selectedVersion.ai_summary}
                    </p>
                  </div>
                )}
                <DocEditor
                  content={selectedVersion.content}
                  editable={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right panel: suggestions */}
        {mode !== "history" && (
          <div className="w-72 shrink-0 border-l border-[#1e1e24] bg-[#0e0e12] overflow-auto flex flex-col">
            <div className="px-4 py-3 border-b border-[#1e1e24] flex items-center justify-between">
              <span className="text-sm font-medium text-[#f2f2f5] flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-indigo-400" />
                Suggestions
              </span>
              <Badge variant="warning">{DEMO_SUGGESTIONS.filter((s) => s.status === "open").length} open</Badge>
            </div>

            <div className="flex-1 p-3 space-y-2">
              {DEMO_SUGGESTIONS.map((s) => (
                <Link
                  key={s.id}
                  href={`/dashboard/docs/${docId}/suggestions/${s.id}`}
                  className="block p-3 rounded-lg border border-[#1e1e24] hover:border-[#2a2a32] bg-[#111114] hover:bg-[#13131a] transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-sm font-medium text-[#f2f2f5] leading-tight">
                      {s.title}
                    </span>
                    <Badge
                      variant={
                        s.status === "open"
                          ? "warning"
                          : s.status === "merged"
                          ? "success"
                          : "danger"
                      }
                      className="shrink-0 text-[10px]"
                    >
                      {s.status === "merged" ? (
                        <Check className="w-2.5 h-2.5" />
                      ) : s.status === "rejected" ? (
                        <X className="w-2.5 h-2.5" />
                      ) : null}
                      {s.status}
                    </Badge>
                  </div>
                  {s.description && (
                    <p className="text-xs text-[#606070] line-clamp-2 mb-2">{s.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-[#606070]">
                    <span>{s.created_by}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {s.comments}
                    </span>
                    <span>{formatRelativeTime(s.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
