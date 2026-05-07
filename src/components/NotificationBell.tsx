"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, GitMerge, GitPullRequest, MessageSquare, ThumbsUp, X } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  payload: {
    suggestion_id?: string;
    suggestion_title?: string;
    doc_id?: string;
    actor_id?: string;
    decision?: string;
  };
  read: boolean;
  created_at: string;
}

function notificationMeta(n: Notification) {
  const title = n.payload.suggestion_title ?? "a suggestion";
  switch (n.type) {
    case "suggestion_opened":
      return {
        icon: <GitPullRequest className="h-4 w-4 text-indigo-500" />,
        text: `Someone opened a suggestion: "${title}"`,
        href: n.payload.doc_id
          ? `/dashboard/docs/${n.payload.doc_id}`
          : "/dashboard",
      };
    case "review_posted":
      return {
        icon:
          n.payload.decision === "approved" ? (
            <ThumbsUp className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-red-500" />
          ),
        text: `Your suggestion "${title}" was ${n.payload.decision ?? "reviewed"}`,
        href: n.payload.suggestion_id
          ? `/dashboard/docs/${n.payload.doc_id}/suggestions/${n.payload.suggestion_id}`
          : "/dashboard",
      };
    case "suggestion_merged":
      return {
        icon: <GitMerge className="h-4 w-4 text-green-500" />,
        text: `Your suggestion "${title}" was merged`,
        href: n.payload.suggestion_id
          ? `/dashboard/docs/${n.payload.doc_id}/suggestions/${n.payload.suggestion_id}`
          : "/dashboard",
      };
    case "suggestion_rejected":
      return {
        icon: <X className="h-4 w-4 text-red-500" />,
        text: `Your suggestion "${title}" was rejected`,
        href: n.payload.suggestion_id
          ? `/dashboard/docs/${n.payload.doc_id}/suggestions/${n.payload.suggestion_id}`
          : "/dashboard",
      };
    case "comment_posted":
      return {
        icon: <MessageSquare className="h-4 w-4 text-indigo-400" />,
        text: `Someone commented on your suggestion "${title}"`,
        href: n.payload.suggestion_id
          ? `/dashboard/docs/${n.payload.doc_id}/suggestions/${n.payload.suggestion_id}`
          : "/dashboard",
      };
    default:
      return {
        icon: <Bell className="h-4 w-4 text-foreground-3" />,
        text: "New notification",
        href: "/dashboard",
      };
  }
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // silent
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleToggle = () => {
    setOpen((v) => !v);
    if (!open) void fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClickNotification = async (n: Notification) => {
    const { href } = notificationMeta(n);
    // Mark as read locally immediately
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
    );
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-foreground-2 transition-colors hover:bg-surface-2 hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 items-center justify-center rounded-full bg-indigo-500">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-[1.6rem] border border-border bg-surface shadow-[0_32px_64px_-20px_var(--shadow-color)]">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <p className="text-sm font-semibold text-foreground">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/15 text-[10px] font-bold text-indigo-500">
                  {unreadCount}
                </span>
              )}
            </p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-600"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Bell className="mx-auto mb-3 h-7 w-7 text-foreground-3" />
                <p className="text-sm text-foreground-2">No notifications yet.</p>
                <p className="mt-1 text-xs text-foreground-3">
                  You&apos;ll see activity from your workspace here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => {
                  const { icon, text } = notificationMeta(n);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleClickNotification(n)}
                      className={`flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-2/70 ${
                        !n.read ? "bg-indigo-500/5" : ""
                      }`}
                    >
                      <span className="mt-0.5 shrink-0">{icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm leading-6 text-foreground">{text}</p>
                        <p className="mt-0.5 text-xs text-foreground-3">
                          {formatRelativeTime(n.created_at)}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
