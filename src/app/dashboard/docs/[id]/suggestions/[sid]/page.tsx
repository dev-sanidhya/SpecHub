"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  Copy,
  GitMerge,
  GitPullRequest,
  Link2,
  Loader2,
  MessageSquare,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DiffView, jsonToText } from "@/components/diff/DiffView";
import { UserChip } from "@/components/UserChip";
import { formatRelativeTime } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

interface Suggestion {
  id: string;
  title: string;
  description: string | null;
  status: "open" | "approved" | "rejected" | "merged";
  created_by: string;
  created_at: string;
  proposed_content: object;
  base_version_id: string;
  baseVersion?: { content: object; version_number: number };
}

interface Review {
  id: string;
  reviewer_id: string;
  decision: "approved" | "rejected" | "changes_requested";
  comment: string | null;
  created_at: string;
}

interface Comment {
  id: string;
  author_id: string;
  body: string;
  anchor_text: string | null;
  created_at: string;
}


export default function SuggestionPage() {
  const params = useParams();
  const docId = params.id as string;
  const sid = params.sid as string;
  const { user } = useUser();

  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [staleBase, setStaleBase] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [generatingShare, setGeneratingShare] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [members, setMembers] = useState<{ user_id: string; name: string }[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [anchorText, setAnchorText] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/workspace/members")
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setMembers(data as { user_id: string; name: string }[]);
      })
      .catch(() => {});
  }, []);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setComment(val);
    const atPos = val.lastIndexOf("@");
    if (atPos !== -1 && atPos === val.length - 1) {
      setMentionQuery("");
    } else if (atPos !== -1 && !val.slice(atPos + 1).includes(" ")) {
      setMentionQuery(val.slice(atPos + 1));
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (member: { user_id: string; name: string }) => {
    const atPos = comment.lastIndexOf("@");
    const before = atPos >= 0 ? comment.slice(0, atPos) : comment;
    setComment(`${before}@${member.name} `);
    setMentionQuery(null);
  };

  const mentionMatches = mentionQuery !== null
    ? members.filter((m) => m.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 6)
    : [];

  const load = useCallback(async () => {
    const [s, r, c] = await Promise.all([
      fetch(`/api/suggestions/${sid}`).then((res) => res.json()),
      fetch(`/api/suggestions/${sid}/reviews`).then((res) => res.json()),
      fetch(`/api/suggestions/${sid}/comments`).then((res) => res.json()),
    ]);
    setSuggestion(s);
    setReviews(r);
    setComments(c);
    setLoading(false);
  }, [sid]);

  const generateSummary = useCallback(async () => {
    setLoadingSummary(true);
    setAiSummary(null);
    try {
      const res = await fetch(`/api/suggestions/${sid}/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setAiSummary(data.summary ?? null);
    } catch {
      setAiSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  }, [sid]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);

    return () => clearTimeout(timer);
  }, [load]);

  const myReview = reviews.find((r) => r.reviewer_id === user?.id);
  const approvalCount = reviews.filter((r) => r.decision === "approved").length;

  const handleReview = useCallback(
    async (decision: "approved" | "rejected" | "changes_requested") => {
      setSubmittingReview(true);
      try {
        await fetch(`/api/suggestions/${sid}/reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision }),
        });
        await load();
      } finally {
        setSubmittingReview(false);
      }
    },
    [sid, load]
  );

  const handleMerge = useCallback(async (force = false) => {
    setMerging(true);
    setMergeError(null);
    setStaleBase(false);
    try {
      const res = await fetch(`/api/suggestions/${sid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "merged", force }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errData = data as { error?: string; code?: string };
        if (errData.code === "stale_base") {
          setStaleBase(true);
          setMergeError(errData.error ?? "Document was updated since this suggestion was opened.");
        } else {
          setMergeError(errData.error ?? "Merge failed. Check approval requirements.");
        }
        return;
      }
      await load();
    } finally {
      setMerging(false);
    }
  }, [sid, load]);

  const handleReject = useCallback(async () => {
    await fetch(`/api/suggestions/${sid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });
    await load();
  }, [sid, load]);

  const handleGenerateShare = useCallback(async () => {
    setGeneratingShare(true);
    try {
      const res = await fetch(`/api/suggestions/${sid}/share`, { method: "POST" });
      const data = await res.json();
      const url = `${window.location.origin}/share/${data.token}`;
      setShareLink(url);
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      // silent
    } finally {
      setGeneratingShare(false);
    }
  }, [sid]);

  const handleComment = useCallback(async () => {
    if (!comment.trim()) return;
    setSubmittingComment(true);
    try {
      await fetch(`/api/suggestions/${sid}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: comment, anchor_text: anchorText }),
      });
      setComment("");
      setAnchorText(null);
      await load();
    } finally {
      setSubmittingComment(false);
    }
  }, [comment, anchorText, sid, load]);

  if (loading || !suggestion) {
    return (
      <div className="flex h-[calc(100vh-9rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-border-3" />
      </div>
    );
  }

  const oldText = jsonToText(suggestion.baseVersion?.content ?? null);
  const newText = jsonToText(suggestion.proposed_content);
  const isOpen = suggestion.status === "open";

  return (
    <div className="space-y-6 px-1 pb-6">
      <section className="panel overflow-hidden rounded-[2.2rem]">
        <div className="border-b border-border px-6 py-7 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/dashboard/docs/${docId}`}>
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                </Link>
                <Badge variant={suggestion.status === "open" ? "warning" : suggestion.status === "merged" ? "success" : "danger"}>
                  {suggestion.status}
                </Badge>
                {suggestion.baseVersion && <Badge variant="outline">base v{suggestion.baseVersion.version_number}</Badge>}
              </div>

              <h1 className="mt-5 truncate text-3xl font-semibold tracking-[-0.05em] text-foreground">{suggestion.title}</h1>
              {suggestion.description && <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground-2">{suggestion.description}</p>}
              <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-foreground-3">
                <UserChip userId={suggestion.created_by} showYou />
                <span>opened this suggestion {formatRelativeTime(suggestion.created_at)}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
              {/* Share link button - always visible */}
              {shareLink ? (
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(shareLink); setShareCopied(true); setTimeout(() => setShareCopied(false), 2500); }}
                  className="flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-3.5 py-2 text-xs font-semibold text-green-600 transition-colors hover:bg-green-500/15 dark:text-green-400"
                >
                  {shareCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {shareCopied ? "Copied!" : "Copy share link"}
                </button>
              ) : (
                <Button variant="ghost" size="md" onClick={handleGenerateShare} loading={generatingShare} className="gap-2">
                  <Link2 className="h-4 w-4" />
                  Share
                </Button>
              )}
              {isOpen ? (
                <>
                  {user?.id !== suggestion.created_by && myReview?.decision !== "approved" && (
                    <Button size="md" onClick={() => handleReview("approved")} loading={submittingReview} className="gap-2">
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                  )}
                  {user?.id !== suggestion.created_by && myReview?.decision !== "changes_requested" && (
                    <Button size="md" variant="ghost" onClick={() => handleReview("changes_requested")} loading={submittingReview} className="gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Request changes
                    </Button>
                  )}
                  {approvalCount >= 1 && (
                    <div className="flex flex-col items-end gap-1.5">
                      <Button size="md" variant="secondary" onClick={() => handleMerge(false)} loading={merging} className="gap-2">
                        <GitMerge className="h-4 w-4" />
                        Merge
                      </Button>
                      {staleBase && (
                        <div className="flex flex-col items-end gap-1">
                          <p className="max-w-xs text-right text-xs text-amber-600 dark:text-amber-400">{mergeError}</p>
                          <button
                            type="button"
                            onClick={() => handleMerge(true)}
                            className="text-xs font-semibold text-red-500 underline underline-offset-2 hover:text-red-600"
                          >
                            Force merge anyway
                          </button>
                        </div>
                      )}
                      {!staleBase && mergeError && (
                        <p className="max-w-xs text-right text-xs text-red-500">{mergeError}</p>
                      )}
                    </div>
                  )}
                  <Button size="md" variant="danger" onClick={handleReject} className="gap-2">
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-border md:grid-cols-4">
          <div className="bg-surface px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground-3">Reviews</p>
            <p className="mt-2.5 text-lg font-semibold text-foreground">{reviews.length}</p>
          </div>
          <div className="bg-surface px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground-3">Approvals</p>
            <p className="mt-2.5 text-lg font-semibold text-foreground">{approvalCount}</p>
          </div>
          <div className="bg-surface px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground-3">Comments</p>
            <p className="mt-2.5 text-lg font-semibold text-foreground">{comments.length}</p>
          </div>
          <div className="bg-surface px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground-3">Mergeability</p>
            <p className="mt-2.5 text-lg font-semibold text-foreground">
              {isOpen ? (approvalCount >= 1 ? "Ready" : "Blocked") : suggestion.status}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <div className="panel overflow-hidden rounded-[2rem]">
            <div className="border-b border-border px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">Files changed</p>
            </div>
            <div
              className="panel-soft overflow-hidden rounded-none"
              onMouseUp={() => {
                const sel = window.getSelection()?.toString().trim();
                if (sel && sel.length > 3 && sel.length < 300) setAnchorText(sel);
              }}
            >
              <DiffView oldText={oldText} newText={newText} />
            </div>
          </div>

          <div className="panel overflow-hidden rounded-[2rem]">
            <div className="border-b border-border px-6 py-5">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
                <MessageSquare className="h-3.5 w-3.5" />
                Conversation
              </p>
            </div>

            <div className="space-y-4 p-6">
              {comments.length === 0 ? (
                <p className="py-2 text-sm leading-7 text-foreground-2">No comments yet. Start the discussion around this change.</p>
              ) : (
                comments.map((item) => (
                  <div key={item.id} className="rounded-[1.4rem] border border-border bg-surface-2/65 p-5">
                    {item.anchor_text && (
                      <div className="mb-3 flex items-start gap-2 rounded-[0.8rem] border border-indigo-500/15 bg-indigo-500/5 px-3 py-2">
                        <span className="mt-0.5 h-3 w-0.5 shrink-0 rounded-full bg-indigo-400" />
                        <p className="text-xs italic text-foreground-3 line-clamp-2">{item.anchor_text}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <UserChip userId={item.author_id} showYou />
                      <span className="text-xs text-foreground-3">{formatRelativeTime(item.created_at)}</span>
                    </div>
                    <p className="mt-2.5 text-sm leading-7 text-foreground-2">
                      {item.body.split(/(@\w+)/g).map((part, i) =>
                        part.startsWith("@") ? (
                          <span key={i} className="font-semibold text-indigo-500">{part}</span>
                        ) : part
                      )}
                    </p>
                  </div>
                ))
              )}

              <div className="relative flex flex-col gap-3 border-t border-border pt-5">
                {anchorText && (
                  <div className="flex items-start gap-2 rounded-[1rem] border border-indigo-500/20 bg-indigo-500/6 px-3.5 py-2.5">
                    <span className="mt-0.5 h-3.5 w-0.5 shrink-0 rounded-full bg-indigo-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500">Quoting</p>
                      <p className="mt-0.5 line-clamp-2 text-xs italic text-foreground-2">{anchorText}</p>
                    </div>
                    <button type="button" onClick={() => setAnchorText(null)} className="shrink-0 text-foreground-3 hover:text-foreground">×</button>
                  </div>
                )}
                {!anchorText && (
                  <p className="text-[11px] text-foreground-3">Select text in the diff above to quote it in your comment.</p>
                )}
                {mentionMatches.length > 0 && (
                  <div className="absolute bottom-full mb-1 left-0 z-20 w-56 overflow-hidden rounded-[1.3rem] border border-border bg-surface shadow-lg">
                    {mentionMatches.map((m) => (
                      <button
                        key={m.user_id}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); insertMention(m); }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-surface-2"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/15 text-[10px] font-bold text-indigo-500">
                          {m.name.slice(0, 1).toUpperCase()}
                        </span>
                        {m.name}
                      </button>
                    ))}
                  </div>
                )}
                <textarea
                  placeholder="Add a comment... Type @ to mention a teammate"
                  value={comment}
                  onChange={handleCommentChange}
                  rows={4}
                  className="w-full resize-none rounded-[1.25rem] border border-border bg-surface px-4 py-3.5 text-sm text-foreground shadow-[0_18px_36px_-28px_var(--shadow-color)] placeholder:text-foreground-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/12"
                />
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-foreground-3">Type <kbd className="rounded border border-border bg-surface-2 px-1 text-[10px]">@</kbd> to mention a teammate</p>
                  <Button size="md" variant="secondary" onClick={handleComment} loading={submittingComment} disabled={!comment.trim()}>
                    Post comment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="panel overflow-hidden rounded-[2rem]">
            <div className="border-b border-border px-6 py-5">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
                <GitPullRequest className="h-3.5 w-3.5" />
                Review state
              </p>
            </div>

            <div className="space-y-4 p-6">
              {isOpen ? (
                <>
                  {approvalCount >= 1 ? (
                    <div className="rounded-[1.3rem] border border-green-500/20 bg-green-500/10 px-5 py-4 text-sm leading-7 text-green-600 dark:text-green-400">
                      This suggestion has enough approval to merge.
                    </div>
                  ) : (
                    <div className="rounded-[1.3rem] border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm leading-7 text-amber-600 dark:text-amber-400">
                      Merge is blocked until the suggestion has at least one approval.
                    </div>
                  )}

                  {user?.id === suggestion.created_by ? (
                    <p className="text-sm leading-7 text-foreground-2">
                      You opened this suggestion. Another team member needs to approve it before it can merge.
                    </p>
                  ) : myReview?.decision === "approved" ? (
                    <div className="rounded-[1.3rem] border border-green-500/20 bg-green-500/10 px-5 py-4 text-sm leading-7 text-green-600 dark:text-green-400">
                      You approved this suggestion.
                    </div>
                  ) : myReview?.decision === "changes_requested" ? (
                    <div className="rounded-[1.3rem] border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm leading-7 text-amber-600 dark:text-amber-400">
                      You requested changes. The author can update and resubmit.
                    </div>
                  ) : (
                    <p className="text-sm leading-7 text-foreground-2">Approve this change once the diff and rationale look correct.</p>
                  )}
                </>
              ) : (
                <div
                  className={`rounded-[1.3rem] border px-5 py-4 text-sm leading-7 ${
                    suggestion.status === "merged"
                      ? "border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400"
                      : "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
                  }`}
                >
                  {suggestion.status === "merged" ? "This suggestion was merged into the document." : "This suggestion was rejected."}
                </div>
              )}
            </div>
          </div>

          <div className="panel overflow-hidden rounded-[2rem]">
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
                <Sparkles className="h-3.5 w-3.5" />
                AI summary
              </p>
              {!loadingSummary && (
                <button
                  type="button"
                  onClick={generateSummary}
                  className="flex items-center gap-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/8 px-3 py-1 text-[11px] font-semibold text-indigo-500 transition-colors hover:bg-indigo-500/15"
                >
                  <Sparkles className="h-3 w-3" />
                  {aiSummary ? "Regenerate" : "Generate"}
                </button>
              )}
            </div>

            <div className="p-6">
              {loadingSummary ? (
                <div className="flex items-center gap-2.5 text-sm text-foreground-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing change...
                </div>
              ) : aiSummary ? (
                <p className="text-sm leading-7 text-foreground-2 whitespace-pre-line">{aiSummary}</p>
              ) : (
                <p className="text-sm leading-7 text-foreground-2">Click Generate to get an AI-powered summary of this change.</p>
              )}
            </div>
          </div>

          <div className="panel overflow-hidden rounded-[2rem]">
            <div className="border-b border-border px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">Reviews</p>
            </div>

            <div className="divide-y divide-border">
              {reviews.length === 0 ? (
                <div className="px-6 py-6 text-sm leading-7 text-foreground-2">No reviews yet.</div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="px-6 py-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <UserChip userId={review.reviewer_id} showYou />
                      <Badge variant={review.decision === "approved" ? "success" : review.decision === "changes_requested" ? "warning" : "danger"}>
                        {review.decision === "changes_requested" ? "changes requested" : review.decision}
                      </Badge>
                    </div>
                    {review.comment && <p className="mt-2 text-sm leading-6 text-foreground-2">{review.comment}</p>}
                  </div>
                ))
              )}
            </div>
          </div>

          {isOpen && approvalCount < 1 && (
            <div className="panel-soft rounded-[1.8rem] px-5 py-5">
              <p className="flex items-start gap-3 text-sm leading-7 text-foreground-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                Merge is intentionally blocked until the suggestion has at least one approval.
              </p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
