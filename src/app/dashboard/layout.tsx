"use client";

import { SignOutButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, FilePlus2, LayoutDashboard, LogOut, Orbit, Plus, Settings, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { CommandPalette } from "@/components/CommandPalette";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/activity", label: "Activity", icon: Activity, exact: false },
  { href: "/dashboard/docs/new", label: "New document", icon: FilePlus2, exact: false },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, exact: false },
];

function getHeaderContext(pathname: string) {
  if (pathname === "/dashboard") return { label: "Overview", title: "All documents in your workspace" };
  if (pathname.startsWith("/dashboard/activity")) return { label: "Activity", title: "Recent events across your workspace" };
  if (pathname.startsWith("/dashboard/settings")) return { label: "Settings", title: "Manage workspace and preferences" };
  if (pathname.includes("/suggestions/")) return { label: "Suggestion review", title: "Review and approve proposed changes" };
  if (pathname.startsWith("/dashboard/docs/new")) return { label: "New document", title: "Create a new spec" };
  if (pathname.startsWith("/dashboard/docs/")) return { label: "Document", title: "Living product spec" };
  return { label: "Workspace", title: "Product docs that can survive change" };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { label, title } = getHeaderContext(pathname);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/workspace").then((r) => r.json()).then((ws) => setWorkspaceId(ws?.id ?? null)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1680px] gap-5 px-3 py-3 lg:px-4 lg:py-4">
        <aside className="panel hidden w-[304px] shrink-0 rounded-[2rem] lg:flex lg:flex-col">
          <div className="border-b border-border/80 px-6 py-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1.3rem] bg-indigo-500 shadow-[0_20px_40px_-20px_rgba(99,102,241,0.65)]">
                <span className="text-sm font-bold text-white">S</span>
              </div>
              <div>
                <p className="text-base font-semibold tracking-tight">SpecHub</p>
                <p className="text-xs text-foreground-3">Reviewable product documentation</p>
              </div>
            </Link>
          </div>

          <div className="px-5 py-5">
            <div className="panel-soft rounded-[1.85rem] p-5">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-500">
                <Orbit className="h-3.5 w-3.5" />
                Workspace
              </p>
              <p className="mt-3 text-xl font-semibold tracking-tight text-foreground">Shipping specs without losing context.</p>
              <p className="mt-2.5 text-sm leading-7 text-foreground-2">
                Keep changes, approvals, and AI summaries in one system instead of spread across docs and chat.
              </p>
              <Link
                href="/dashboard/docs/new"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_22px_46px_-24px_rgba(99,102,241,0.6)] transition-all hover:-translate-y-0.5 hover:bg-indigo-600"
              >
                <Plus className="h-4 w-4" />
                New document
              </Link>
            </div>
          </div>

          <nav className="flex-1 px-4 py-2">
            <div className="space-y-1.5">
              {NAV_ITEMS.map(({ href, label: navLabel, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={`${href}-${navLabel}`}
                    href={href}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-[1.4rem] px-4 py-3.5 text-sm font-medium transition-all",
                      active
                        ? "bg-indigo-500/12 text-foreground shadow-[inset_0_0_0_1px_rgba(99,102,241,0.16)]"
                        : "text-foreground-2 hover:bg-surface-2 hover:text-foreground"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className={cn("h-4 w-4", active ? "text-indigo-500" : "text-foreground-3")} />
                      {navLabel}
                    </span>
                    <ArrowUpRight className={cn("h-3.5 w-3.5", active ? "text-indigo-500" : "text-foreground-3")} />
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-border/80 px-4 py-4">
            <div className="rounded-[1.6rem] bg-surface-2/90 px-4 py-4">
              <div className="flex items-center gap-3">
                <UserButton />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">Your account</p>
                  <p className="text-xs text-foreground-3">Theme and session controls</p>
                </div>
                <ThemeToggle />
              </div>

              <SignOutButton redirectUrl="/sign-in">
                <button
                  type="button"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-surface px-3 py-3 text-sm font-medium text-foreground-2 transition-colors hover:bg-surface-3 hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </SignOutButton>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="panel rounded-[2rem] border-border/80 bg-background/60 px-6 py-5 backdrop-blur-xl lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  {label}
                </p>
                <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">
                  {title}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))}
                  className="hidden items-center gap-2 rounded-full border border-border bg-surface-2/80 px-3.5 py-2 text-xs text-foreground-3 transition-colors hover:bg-surface-2 hover:text-foreground lg:flex"
                >
                  <span>Search or jump to...</span>
                  <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
                </button>
                <NotificationBell />
              </div>

              <div className="flex items-center gap-2 lg:hidden">
                <Link href="/dashboard/docs/new">
                  <div className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-indigo-500 px-4 text-sm font-semibold text-white">
                    <Plus className="h-4 w-4" />
                    New
                  </div>
                </Link>
                <UserButton />
                <SignOutButton redirectUrl="/sign-in">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </Button>
                </SignOutButton>
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 pt-5">{children}</main>
        </div>
      </div>

      <CommandPalette workspaceId={workspaceId} />
    </div>
  );
}
