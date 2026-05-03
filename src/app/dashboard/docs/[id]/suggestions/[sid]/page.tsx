"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, GitPullRequest, Check, X, MessageSquare,
  Sparkles, GitMerge, AlertCircle, Loader2,
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

    // Fetch AI diff summary after suggestion data is available
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

  useEffect(() => { load(); }, [load]);

  const myReview = reviews.find((r) => r.reviewer_id === user?.id);
  const approvalCount = reviews.filter((r) => r.decision === "approved").length;

  const handleReview = useCallback(async (decision: "approved" | "rejected") => {
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
  }, [sid, load]);

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
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 text-[#363640] animate-spin" />
      </div>
    );
  }

  const oldText = jsonToText(suggestion.baseVersion?.content ?? null);
  const newText = jsonToText(suggestion.proposed_content);
  const isOpen = suggestion.status === "open";

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[#1e1e24] bg-[#0e0e12] shrink-0">
        <Link href={`/dashboard/docs/${docId}`}>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ChevronLeft className="w-4 h-4" />Back to doc
          </Button>
        </Link>
        <div className="w-px h-5 bg-[#2a2a32]" />
        <GitPullRequest className="w-4 h-4 text-indigo-400" />
        <h1 className="text-[#f2f2f5] font-semibold text-sm truncate">{suggestion.title}</h1>
        <Badge variant={
          suggestion.status === "open" ? "warning" :
          suggestion.status === "merged" ? "success" : "danger"
        }>
          {suggestion.status}
        </Badge>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main: diff + discussion */}
        <div className="flex-1 overflow-auto">
          {/* Meta */}
          <div className="px-6 py-4 border-b border-[#1e1e24]">
            {suggestion.description && (
              <p className="text-sm text-[#a0a0b0] leading-relaxed mb-2">{suggestion.description}</p>
            )}
            <p className="text-xs text-[#606070]">
              Proposed by <span className="text-[#a0a0b0]">{suggestion.created_by.slice(0, 12)}</span>
              {" "}{formatRelativeTime(suggestion.created_at)}
              {suggestion.baseVersion && (
                <> - base v{suggestion.baseVersion.version_number}</>
              )}
            </p>
          </div>

          {/* Diff */}
          <div className="px-6 py-4 border-b border-[#1e1e24]">
            <p className="text-xs text-[#606070] font-medium uppercase tracking-wide mb-3">Changes</p>
            <div className="rounded-lg border border-[#2a2a32] bg-[#111114] overflow-hidden">
              <DiffView oldText={oldText} newText={newText} />
            </div>
          </div>

          {/* Comments */}
          <div className="px-6 py-4">
            <p className="text-xs text-[#606070] font-medium uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Discussion ({comments.length})
            </p>
            <div className="space-y-4 mb-4">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-medium text-indigo-400 shrink-0">
                    {c.author_id.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-[#f2f2f5]">
                        {c.author_id === user?.id ? "You" : c.author_id.slice(0, 8)}
                      </span>
                      <span className="text-xs text-[#606070]">{formatRelativeTime(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-[#a0a0b0] leading-relaxed">{c.body}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-xs text-[#606070]">No comments yet. Start the discussion.</p>
              )}
            </div>

            <div className="flex gap-2">
              <textarea
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="flex-1 px-3 py-2 rounded-lg bg-[#111114] border border-[#2a2a32] text-sm text-[#f2f2f5] placeholder:text-[#606070] focus:outline-none focus:border-indigo-500/40 transition-colors resize-none"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={handleComment}
                loading={submittingComment}
                disabled={!comment.trim()}
                className="self-end"
              >
                Post
              </Button>
            </div>
          </div>
        </div>

        {/* Right panel: actions + reviews */}
        <div className="w-72 shrink-0 border-l border-[#1e1e24] bg-[#0e0e12] overflow-auto flex flex-col">
          {/* Actions */}
          <div className="p-4 border-b border-[#1e1e24]">
            {isOpen ? (
              <>
                {approvalCount >= 1 ? (
                  <div className="mb-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-green-400">{approvalCount} approval{approvalCount > 1 ? "s" : ""}. Ready to merge.</p>
                  </div>
                ) : (
                  <div className="mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-400">Needs at least 1 approval to merge.</p>
                  </div>
                )}
                <div className="space-y-2">
                  {myReview?.decision !== "approved" && (
                    <Button className="w-full gap-1.5" size="sm" onClick={() => handleReview("approved")} loading={submittingReview}>
                      <Check className="w-4 h-4" />Approve
                    </Button>
                  )}
                  {myReview?.decision === "approved" && (
                    <div className="text-xs text-green-400 flex items-center gap-1.5 px-1">
                      <Check className="w-3.5 h-3.5" />You approved this
                    </div>
                  )}
                  {approvalCount >= 1 && (
                    <Button className="w-full gap-1.5" size="sm" variant="secondary" onClick={handleMerge} loading={merging}>
                      <GitMerge className="w-4 h-4" />Merge into doc
                    </Button>
                  )}
                  <Button className="w-full gap-1.5" size="sm" variant="danger" onClick={handleReject}>
                    <X className="w-4 h-4" />Reject
                  </Button>
                </div>
              </>
            ) : (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                suggestion.status === "merged" ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"
              }`}>
                {suggestion.status === "merged" ? (
                  <><GitMerge className="w-4 h-4 text-green-400 shrink-0" /><p className="text-xs text-green-400">This suggestion was merged into the document.</p></>
                ) : (
                  <><X className="w-4 h-4 text-red-400 shrink-0" /><p className="text-xs text-red-400">This suggestion was rejected.</p></>
                )}
              </div>
            )}
          </div>

          {/* AI diff summary */}
          <div className="p-4 border-b border-[#1e1e24]">
            <p className="text-xs text-[#606070] font-medium uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />AI summary
            </p>
            {loadingSummary ? (
              <div className="flex items-center gap-1.5 text-xs text-[#606070]">
                <Loader2 className="w-3 h-3 animate-spin" />Analyzing changes...
              </div>
            ) : aiSummary ? (
              <p className="text-xs text-[#a0a0b0] leading-relaxed whitespace-pre-line">{aiSummary}</p>
            ) : (
              <p className="text-xs text-[#606070] italic">No summary available.</p>
            )}
          </div>

          {/* Reviews */}
          <div className="p-4">
            <p className="text-xs text-[#606070] font-medium uppercase tracking-wide mb-3">
              Reviews ({reviews.length})
            </p>
            {reviews.length === 0 ? (
              <p className="text-xs text-[#606070]">No reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-medium text-indigo-400 shrink-0">
                      {r.reviewer_id.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-medium text-[#f2f2f5]">
                          {r.reviewer_id === user?.id ? "You" : r.reviewer_id.slice(0, 8)}
                        </span>
                        <Badge variant={r.decision === "approved" ? "success" : "danger"} className="text-[10px] py-0">
                          {r.decision === "approved" ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                          {r.decision}
                        </Badge>
                      </div>
                      {r.comment && <p className="text-xs text-[#606070]">{r.comment}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
