"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  GitMerge,
  GitPullRequest,
  Loader2,
  MessageSquare,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DiffView, jsonToText } from "@/components/diff/DiffView";
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
  created_at: string;
}

function authorLabel(value: string) {
  return `@${value.slice(0, 8)}`;
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
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

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
    if (s && !s.error) {
      setLoadingSummary(true);
      fetch(`/api/suggestions/${sid}/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
        .then((res) => res.json())
        .then((data) => setAiSummary(data.summary ?? null))
        .catch(() => setAiSummary(null))
        .finally(() => setLoadingSummary(false));
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
    async (decision: "approved" | "rejected") => {
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

  const handleMerge = useCallback(async () => {
    setMerging(true);
    try {
      await fetch(`/api/suggestions/${sid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "merged" }),
      });
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

  const handleComment = useCallback(async () => {
    if (!comment.trim()) return;
    setSubmittingComment(true);
    try {
      await fetch(`/api/suggestions/${sid}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: comment }),
      });
      setComment("");
      await load();
    } finally {
      setSubmittingComment(false);
    }
  }, [comment, sid, load]);

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
              <p className="mt-3 text-xs text-foreground-3">
                {authorLabel(suggestion.created_by)} opened this suggestion {formatRelativeTime(suggestion.created_at)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
              {isOpen ? (
                <>
                  {myReview?.decision !== "approved" && (
                    <Button size="md" onClick={() => handleReview("approved")} loading={submittingReview} className="gap-2">
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                  )}
                  {approvalCount >= 1 && (
                    <Button size="md" variant="secondary" onClick={handleMerge} loading={merging} className="gap-2">
                      <GitMerge className="h-4 w-4" />
                      Merge
                    </Button>
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
            <div className="panel-soft overflow-hidden rounded-none">
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
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {item.author_id === user?.id ? "You" : authorLabel(item.author_id)}
                      </span>
                      <span className="text-xs text-foreground-3">{formatRelativeTime(item.created_at)}</span>
                    </div>
                    <p className="mt-2.5 text-sm leading-7 text-foreground-2">{item.body}</p>
                  </div>
                ))
              )}

              <div className="flex flex-col gap-3 border-t border-border pt-5">
                <textarea
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-[1.25rem] border border-border bg-surface px-4 py-3.5 text-sm text-foreground shadow-[0_18px_36px_-28px_var(--shadow-color)] placeholder:text-foreground-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/12"
                />
                <div className="flex justify-end">
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

                  {myReview?.decision === "approved" ? (
                    <div className="rounded-[1.3rem] border border-green-500/20 bg-green-500/10 px-5 py-4 text-sm leading-7 text-green-600 dark:text-green-400">
                      You approved this suggestion.
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
            <div className="border-b border-border px-6 py-5">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
                <Sparkles className="h-3.5 w-3.5" />
                AI summary
              </p>
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
                <p className="text-sm leading-7 text-foreground-2">No summary available.</p>
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
                      <span className="text-sm font-semibold text-foreground">
                        {review.reviewer_id === user?.id ? "You" : authorLabel(review.reviewer_id)}
                      </span>
                      <Badge variant={review.decision === "approved" ? "success" : "danger"}>{review.decision}</Badge>
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
