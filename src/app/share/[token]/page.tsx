"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ExternalLink,
  GitMerge,
  GitPullRequest,
  Loader2,
  Lock,
  Orbit,
  ThumbsUp,
  X,
} from "lucide-react";
import { DiffView, jsonToText } from "@/components/diff/DiffView";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils";

interface ShareData {
  suggestion: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    created_at: string;
    proposed_content: object;
  };
  baseVersion: { content: object; version_number: number } | null;
  documentTitle: string;
  reviews: { decision: string; created_at: string }[];
}

const STATUS_BADGE: Record<string, "warning" | "success" | "danger" | "outline"> = {
  open: "warning",
  approved: "success",
  merged: "success",
  rejected: "danger",
};

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/share/${token}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((d) => { if (d) setData(d); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-foreground-3" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-surface-3">
          <Lock className="h-6 w-6 text-foreground-3" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Link not found</h1>
        <p className="max-w-sm text-sm leading-7 text-foreground-2">
          This share link may have been revoked or never existed.
        </p>
        <Link href="/" className="text-sm font-medium text-indigo-500 hover:text-indigo-600">
          Back to SpecHub
        </Link>
      </div>
    );
  }

  const { suggestion, baseVersion, documentTitle, reviews } = data;
  const baseText = baseVersion ? jsonToText(baseVersion.content) : "";
  const proposedText = jsonToText(suggestion.proposed_content);
  const approvals = reviews.filter((r) => r.decision === "approved").length;
  const rejections = reviews.filter((r) => r.decision === "rejected").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-6 lg:py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[1rem] bg-indigo-500 shadow-[0_16px_32px_-16px_rgba(99,102,241,0.6)]">
              <span className="text-xs font-bold text-white">S</span>
            </div>
            <span className="text-sm font-semibold text-foreground">SpecHub</span>
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/8 px-3.5 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <Orbit className="h-3.5 w-3.5" />
            Read-only public view
          </div>
        </div>

        {/* Suggestion header */}
        <section className="panel overflow-hidden rounded-[2rem]">
          <div className="border-b border-border px-7 py-7 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground-3">
                  <GitPullRequest className="h-3.5 w-3.5" />
                  Suggestion on &ldquo;{documentTitle}&rdquo;
                </p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{suggestion.title}</h1>
                {suggestion.description && (
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-2">{suggestion.description}</p>
                )}
                <p className="mt-3 text-xs text-foreground-3">
                  Opened {formatRelativeTime(suggestion.created_at)}
                  {baseVersion && ` · against v${baseVersion.version_number}`}
                </p>
              </div>
              <div className="shrink-0">
                <Badge variant={STATUS_BADGE[suggestion.status] ?? "outline"}>
                  {suggestion.status === "merged" && <GitMerge className="mr-1 h-3 w-3" />}
                  {suggestion.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Review summary */}
          {reviews.length > 0 && (
            <div className="grid gap-px bg-border md:grid-cols-3">
              <div className="bg-surface px-6 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground-3">Reviews</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{reviews.length}</p>
              </div>
              <div className="bg-surface px-6 py-5">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-green-600 dark:text-green-400">
                  <ThumbsUp className="h-3 w-3" />
                  Approvals
                </p>
                <p className="mt-2 text-xl font-semibold text-foreground">{approvals}</p>
              </div>
              <div className="bg-surface px-6 py-5">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-500">
                  <X className="h-3 w-3" />
                  Rejections
                </p>
                <p className="mt-2 text-xl font-semibold text-foreground">{rejections}</p>
              </div>
            </div>
          )}
        </section>

        {/* Diff */}
        <section className="mt-6 panel overflow-hidden rounded-[2rem]">
          <div className="border-b border-border px-7 py-5 lg:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
              Proposed changes
            </p>
            <p className="mt-1.5 text-sm text-foreground-2">
              Green lines are additions, red lines are removals.
            </p>
          </div>
          <DiffView oldText={baseText} newText={proposedText} />
        </section>

        {/* Review timeline */}
        {reviews.length > 0 && (
          <section className="mt-6 panel overflow-hidden rounded-[2rem]">
            <div className="border-b border-border px-7 py-5 lg:px-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
                Review timeline
              </p>
            </div>
            <div className="divide-y divide-border">
              {reviews.map((review, i) => (
                <div key={i} className="flex items-center gap-3 px-7 py-4 lg:px-8">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    review.decision === "approved"
                      ? "bg-green-500/12 text-green-600 dark:text-green-400"
                      : "bg-red-500/12 text-red-500"
                  }`}>
                    {review.decision === "approved" ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  </div>
                  <p className="text-sm text-foreground-2">
                    <span className="font-medium capitalize text-foreground">{review.decision}</span>
                    {" · "}
                    {formatRelativeTime(review.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-sm text-foreground-3">
            Powered by{" "}
            <Link href="/" className="inline-flex items-center gap-1 font-medium text-indigo-500 hover:text-indigo-600">
              SpecHub
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            {" · "}
            GitHub for PRDs
          </p>
        </div>
      </div>
    </div>
  );
}
