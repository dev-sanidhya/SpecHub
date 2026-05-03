"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  GitPullRequest,
  Check,
  X,
  MessageSquare,
  Sparkles,
  GitMerge,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DiffView } from "@/components/diff/DiffView";
import { formatRelativeTime } from "@/lib/utils";

const DEMO_SUGGESTION = {
  id: "s1",
  title: "Add magic link auth option",
  description:
    "Some users prefer not to use OAuth providers. Adding a magic link fallback gives teams an alternative without adding password complexity.",
  status: "open" as const,
  created_by: "Priya",
  created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  base_version: 4,
  oldText: `Authentication Flow PRD

Overview

Users access the dashboard immediately after signup. Onboarding is optional and can be completed later.

Requirements

- Google OAuth and GitHub OAuth supported
- Email verification runs async, does not block access
- Session expires after 30 days of inactivity`,
  newText: `Authentication Flow PRD

Overview

Users access the dashboard immediately after signup. Onboarding is optional and can be completed later.

Requirements

- Google OAuth and GitHub OAuth supported
- Magic link authentication as a fallback option
- Email verification runs async, does not block access
- Session expires after 30 days of inactivity
- Magic link tokens expire after 15 minutes`,
};

const DEMO_COMMENTS = [
  {
    id: "c1",
    author: "Sanidhya",
    body: "Good idea. We should also add rate limiting on magic link requests - max 5/hour per email.",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "c2",
    author: "Priya",
    body: "Agreed - I'll add that to the requirements. Should 15 min expiry be configurable per workspace?",
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
];

const DEMO_REVIEWS = [
  {
    id: "r1",
    reviewer: "Sanidhya",
    decision: "approved" as const,
    comment: "Looks good. Add the rate limiting note and this is ready.",
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
];

export default function SuggestionPage() {
  const params = useParams();
  const docId = params.id as string;

  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [approvingMerge, setApprovingMerge] = useState(false);
  const [reviews, setReviews] = useState(DEMO_REVIEWS);
  const [comments, setComments] = useState(DEMO_COMMENTS);

  const hasApproved = reviews.some((r) => r.reviewer === "You");
  const approvalCount = reviews.filter((r) => r.decision === "approved").length;

  async function handleApprove() {
    setApprovingMerge(true);
    await new Promise((r) => setTimeout(r, 800));
    setReviews((prev) => [
      ...prev,
      {
        id: `r${prev.length + 1}`,
        reviewer: "You",
        decision: "approved",
        comment: "",
        created_at: new Date().toISOString(),
      },
    ]);
    setApprovingMerge(false);
  }

  async function handleComment() {
    if (!comment.trim()) return;
    setSubmittingComment(true);
    await new Promise((r) => setTimeout(r, 500));
    setComments((prev) => [
      ...prev,
      {
        id: `c${prev.length + 1}`,
        author: "You",
        body: comment,
        created_at: new Date().toISOString(),
      },
    ]);
    setComment("");
    setSubmittingComment(false);
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[#1e1e24] bg-[#0e0e12] shrink-0">
        <Link href={`/dashboard/docs/${docId}`}>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ChevronLeft className="w-4 h-4" />
            Back to doc
          </Button>
        </Link>
        <div className="w-px h-5 bg-[#2a2a32]" />
        <GitPullRequest className="w-4 h-4 text-indigo-400" />
        <h1 className="text-[#f2f2f5] font-semibold text-sm truncate">
          {DEMO_SUGGESTION.title}
        </h1>
        <Badge variant={DEMO_SUGGESTION.status === "open" ? "warning" : "success"}>
          {DEMO_SUGGESTION.status}
        </Badge>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main: diff */}
        <div className="flex-1 overflow-auto">
          {/* Meta */}
          <div className="px-6 py-4 border-b border-[#1e1e24]">
            <p className="text-sm text-[#a0a0b0] leading-relaxed">
              {DEMO_SUGGESTION.description}
            </p>
            <p className="text-xs text-[#606070] mt-2">
              Proposed by <span className="text-[#a0a0b0]">{DEMO_SUGGESTION.created_by}</span>{" "}
              {formatRelativeTime(DEMO_SUGGESTION.created_at)} - base v{DEMO_SUGGESTION.base_version}
            </p>
          </div>

          {/* Diff */}
          <div className="px-6 py-4">
            <p className="text-xs text-[#606070] font-medium uppercase tracking-wide mb-3">
              Changes
            </p>
            <div className="rounded-lg border border-[#2a2a32] bg-[#111114] overflow-hidden">
              <DiffView
                oldText={DEMO_SUGGESTION.oldText}
                newText={DEMO_SUGGESTION.newText}
              />
            </div>
          </div>

          {/* Comments */}
          <div className="px-6 py-4 border-t border-[#1e1e24]">
            <p className="text-xs text-[#606070] font-medium uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Discussion ({comments.length})
            </p>
            <div className="space-y-3 mb-4">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-medium text-indigo-400 shrink-0">
                    {c.author[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-[#f2f2f5]">{c.author}</span>
                      <span className="text-xs text-[#606070]">
                        {formatRelativeTime(c.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-[#a0a0b0] leading-relaxed">{c.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add comment */}
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

        {/* Right panel: reviews + actions */}
        <div className="w-72 shrink-0 border-l border-[#1e1e24] bg-[#0e0e12] overflow-auto flex flex-col">
          {/* Merge status */}
          <div className="p-4 border-b border-[#1e1e24]">
            {approvalCount >= 1 ? (
              <div className="mb-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <p className="text-xs text-green-400">
                  {approvalCount} approval{approvalCount > 1 ? "s" : ""}. Ready to merge.
                </p>
              </div>
            ) : (
              <div className="mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-400">
                  Needs at least 1 approval to merge.
                </p>
              </div>
            )}

            <div className="space-y-2">
              {!hasApproved && (
                <Button
                  className="w-full gap-1.5"
                  size="sm"
                  onClick={handleApprove}
                  loading={approvingMerge}
                >
                  <Check className="w-4 h-4" />
                  Approve
                </Button>
              )}
              {approvalCount >= 1 && (
                <Button className="w-full gap-1.5" size="sm" variant="secondary">
                  <GitMerge className="w-4 h-4" />
                  Merge into doc
                </Button>
              )}
              <Button className="w-full gap-1.5" size="sm" variant="danger">
                <X className="w-4 h-4" />
                Reject
              </Button>
            </div>
          </div>

          {/* AI summary */}
          <div className="p-4 border-b border-[#1e1e24]">
            <p className="text-xs text-[#606070] font-medium uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              AI summary
            </p>
            <p className="text-xs text-[#a0a0b0] leading-relaxed">
              Adds magic link as a fallback auth method. One new requirement added, one expiry
              constraint introduced. Net scope increase: low. No breaking changes to existing OAuth flow.
            </p>
          </div>

          {/* Reviews */}
          <div className="p-4">
            <p className="text-xs text-[#606070] font-medium uppercase tracking-wide mb-3">
              Reviews ({reviews.length})
            </p>
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-medium text-indigo-400 shrink-0">
                    {r.reviewer[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-medium text-[#f2f2f5]">
                        {r.reviewer}
                      </span>
                      <Badge
                        variant={r.decision === "approved" ? "success" : "danger"}
                        className="text-[10px] py-0"
                      >
                        {r.decision === "approved" ? (
                          <Check className="w-2.5 h-2.5" />
                        ) : (
                          <X className="w-2.5 h-2.5" />
                        )}
                        {r.decision}
                      </Badge>
                    </div>
                    {r.comment && (
                      <p className="text-xs text-[#606070]">{r.comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
