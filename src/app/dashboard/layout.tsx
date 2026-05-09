"use client";

import { SignOutButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Activity, ArrowUpRight, Check, ChevronDown, FilePlus2,
  LayoutDashboard, LogOut, Orbit, Plus, Settings, Sparkles
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { CommandPalette } from "@/components/CommandPalette";
import { Button } from "@/components/ui/Button";
import { WorkspaceProvider, useWorkspace } from "@/contexts/WorkspaceContext";
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

function WorkspaceSwitcher() {
  const router = useRouter();
  const { workspaces, activeWorkspace, switchWorkspace, createWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const ws = await createWorkspace(newName.trim());
    setCreating(false);
    setNewName("");
    setOpen(false);
    if (ws) router.push("/dashboard");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-[1.4rem] border border-border bg-surface-2/70 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
      >
        <span className="flex items-center gap-2 min-w-0">
          <Orbit className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
          <span className="truncate">{activeWorkspace?.name ?? "Workspace"}</span>
        </span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-foreground-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-[1.6rem] border border-border bg-surface shadow-[0_24px_48px_-12px_var(--shadow-color)]">
            <div className="px-3 pb-2 pt-3">
              <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground-3">Your workspaces</p>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => { switchWorkspace(ws.id); setOpen(false); router.push("/dashboard"); }}
                  className="flex w-full items-center justify-between gap-3 rounded-[1.1rem] px-3 py-2.5 text-sm transition-colors hover:bg-surface-2"
                >
                  <span className="truncate font-medium text-foreground">{ws.name}</span>
                  {ws.id === activeWorkspace?.id && <Check className="h-3.5 w-3.5 shrink-0 text-indigo-500" />}
                </button>
              ))}
            </div>
            <div className="border-t border-border px-3 py-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New workspace name..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  className="flex-1 rounded-[1rem] border border-border bg-surface-2 px-3 py-2 text-xs text-foreground placeholder:text-foreground-3 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                />
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                  className="rounded-[1rem] bg-indigo-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40 hover:bg-indigo-600"
                >
                  {creating ? "..." : <Plus className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { label, title } = getHeaderContext(pathname);
  const { activeWorkspace } = useWorkspace();

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

          {/* Workspace switcher */}
          <div className="border-b border-border/60 px-4 py-4">
            <WorkspaceSwitcher />
          </div>

          <div className="px-5 py-5">
            <Link
              href="/dashboard/docs/new"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_22px_46px_-24px_rgba(99,102,241,0.6)] transition-all hover:-translate-y-0.5 hover:bg-indigo-600"
            >
              <Plus className="h-4 w-4" />
              New document
            </Link>
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

      <CommandPalette workspaceId={activeWorkspace?.id ?? null} />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <DashboardContent>{children}</DashboardContent>
    </WorkspaceProvider>
  );
}
