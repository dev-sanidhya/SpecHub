"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Bell,
  GitMerge,
  GitPullRequest,
  MessageSquare,
  ThumbsUp,
  UserPlus,
  X,
} from "lucide-react";
import { UserChip } from "@/components/UserChip";
import { formatRelativeTime } from "@/lib/utils";

interface ActivityEvent {
  id: string;
  type: string;
  user_id: string;
  payload: {
    suggestion_id?: string;
    suggestion_title?: string;
    doc_id?: string;
    actor_id?: string;
    decision?: string;
    doc_title?: string;
    member_id?: string;
  };
  created_at: string;
}

interface EventMeta {
  icon: React.ReactNode;
  label: string;
  href: string;
  accent: string;
}

function getEventMeta(event: ActivityEvent): EventMeta {
  const title = event.payload.suggestion_title ?? "a suggestion";
  const docTitle = event.payload.doc_title ?? "a document";

  switch (event.type) {
    case "suggestion_opened":
      return {
        icon: <GitPullRequest className="h-4 w-4" />,
        label: `opened a suggestion "${title}" on ${docTitle}`,
        href: event.payload.suggestion_id && event.payload.doc_id
          ? `/dashboard/docs/${event.payload.doc_id}/suggestions/${event.payload.suggestion_id}`
          : "/dashboard",
        accent: "bg-indigo-500/12 text-indigo-500",
      };
    case "review_posted":
      return {
        icon: event.payload.decision === "approved"
          ? <ThumbsUp className="h-4 w-4" />
          : <X className="h-4 w-4" />,
        label: `${event.payload.decision === "approved" ? "approved" : "rejected"} suggestion "${title}"`,
        href: event.payload.suggestion_id && event.payload.doc_id
          ? `/dashboard/docs/${event.payload.doc_id}/suggestions/${event.payload.suggestion_id}`
          : "/dashboard",
        accent: event.payload.decision === "approved"
          ? "bg-green-500/12 text-green-600 dark:text-green-400"
          : "bg-red-500/12 text-red-600 dark:text-red-400",
      };
    case "suggestion_merged":
      return {
        icon: <GitMerge className="h-4 w-4" />,
        label: `merged suggestion "${title}" into ${docTitle}`,
        href: event.payload.suggestion_id && event.payload.doc_id
          ? `/dashboard/docs/${event.payload.doc_id}/suggestions/${event.payload.suggestion_id}`
          : "/dashboard",
        accent: "bg-green-500/12 text-green-600 dark:text-green-400",
      };
    case "suggestion_rejected":
      return {
        icon: <X className="h-4 w-4" />,
        label: `closed suggestion "${title}" without merging`,
        href: event.payload.suggestion_id && event.payload.doc_id
          ? `/dashboard/docs/${event.payload.doc_id}/suggestions/${event.payload.suggestion_id}`
          : "/dashboard",
        accent: "bg-red-500/12 text-red-600 dark:text-red-400",
      };
    case "comment_posted":
      return {
        icon: <MessageSquare className="h-4 w-4" />,
        label: `commented on suggestion "${title}"`,
        href: event.payload.suggestion_id && event.payload.doc_id
          ? `/dashboard/docs/${event.payload.doc_id}/suggestions/${event.payload.suggestion_id}`
          : "/dashboard",
        accent: "bg-foreground-3/12 text-foreground-3",
      };
    case "member_joined":
      return {
        icon: <UserPlus className="h-4 w-4" />,
        label: "joined the workspace",
        href: "/dashboard/settings",
        accent: "bg-indigo-500/12 text-indigo-500",
      };
    default:
      return {
        icon: <Bell className="h-4 w-4" />,
        label: event.type.replace(/_/g, " "),
        href: "/dashboard",
        accent: "bg-surface-3 text-foreground-3",
      };
  }
}

function groupByDate(events: ActivityEvent[]): { label: string; events: ActivityEvent[] }[] {
  const groups: Map<string, ActivityEvent[]> = new Map();

  for (const event of events) {
    const d = new Date(event.created_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    let label: string;
    if (diffDays === 0) label = "Today";
    else if (diffDays === 1) label = "Yesterday";
    else if (diffDays < 7) label = `${diffDays} days ago`;
    else {
      label = d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: diffDays > 365 ? "numeric" : undefined });
    }

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(event);
  }

  return Array.from(groups.entries()).map(([label, evts]) => ({ label, events: evts }));
}

export default function ActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const grouped = groupByDate(events);

  if (loading) {
    return (
      <div className="space-y-6 px-1 pb-6">
        <section className="panel overflow-hidden rounded-[2.2rem]">
          <div className="px-7 py-8 lg:px-8">
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-surface-3" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-3/5 animate-pulse rounded-full bg-surface-3" />
                    <div className="h-3 w-1/4 animate-pulse rounded-full bg-surface-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-1 pb-6">
      <section className="panel overflow-hidden rounded-[2.2rem]">
        <div className="border-b border-border px-7 py-7 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[1.2rem] bg-indigo-500/12">
              <Activity className="h-4.5 w-4.5 text-indigo-500" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">Workspace feed</p>
              <p className="mt-1 text-sm text-foreground-2">
                {events.length === 0
                  ? "No activity yet"
                  : `${events.length} event${events.length === 1 ? "" : "s"} across the workspace`}
              </p>
            </div>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 px-7 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.6rem] bg-surface-3">
              <Activity className="h-6 w-6 text-foreground-3" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">Nothing here yet</p>
              <p className="mt-2 max-w-xs text-sm leading-7 text-foreground-2">
                Activity shows up here when your team opens suggestions, posts reviews, merges changes, or leaves comments.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="mt-2 rounded-full bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_36px_-20px_rgba(99,102,241,0.5)] transition-all hover:-translate-y-0.5 hover:bg-indigo-600"
            >
              Go to documents
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {grouped.map((group) => (
              <div key={group.label}>
                <div className="sticky top-0 z-10 border-b border-border/60 bg-surface/90 px-7 py-3 backdrop-blur-sm lg:px-8">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground-3">{group.label}</p>
                </div>
                <div className="divide-y divide-border/40">
                  {group.events.map((event) => {
                    const meta = getEventMeta(event);
                    return (
                      <Link
                        key={event.id}
                        href={meta.href}
                        className="flex items-start gap-4 px-7 py-5 transition-colors hover:bg-surface-2/40 lg:px-8"
                      >
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.accent}`}>
                          {meta.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-6 text-foreground">
                            <UserChip userId={event.user_id} />
                            {" "}
                            <span className="text-foreground-2">{meta.label}</span>
                          </p>
                          <p className="mt-1 text-xs text-foreground-3">{formatRelativeTime(event.created_at)}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
