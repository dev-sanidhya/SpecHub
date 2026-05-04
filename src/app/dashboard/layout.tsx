"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, Plus, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard", label: "Documents", icon: FileText },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-border/80 bg-surface/80 backdrop-blur-xl lg:flex lg:flex-col">
          <div className="border-b border-border/80 px-6 py-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500 shadow-[0_16px_36px_-18px_rgba(99,102,241,0.6)]">
                <span className="text-sm font-bold text-white">S</span>
              </div>
              <div>
                <p className="text-base font-semibold tracking-tight">SpecHub</p>
                <p className="text-xs text-foreground-3">Reviewable product documentation</p>
              </div>
            </Link>
          </div>

          <div className="px-4 py-5">
            <div className="panel rounded-3xl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-500">Workspace</p>
              <p className="mt-3 text-lg font-semibold text-foreground">Shipping specs without losing context.</p>
              <p className="mt-2 text-sm leading-6 text-foreground-2">
                Keep changes, approvals, and AI summaries in one system instead of spread across docs and chat.
              </p>
              <Link
                href="/dashboard/docs/new"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-600"
              >
                <Plus className="h-4 w-4" />
                New document
              </Link>
            </div>
          </div>

          <nav className="flex-1 px-3">
            <div className="space-y-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                return (
                  <Link
                    key={`${href}-${label}`}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                      active
                        ? "bg-indigo-500/12 text-foreground shadow-[inset_0_0_0_1px_rgba(99,102,241,0.16)]"
                        : "text-foreground-2 hover:bg-surface-2 hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", active ? "text-indigo-500" : "text-foreground-3")} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-border/80 px-4 py-4">
            <div className="flex items-center gap-3 rounded-2xl bg-surface-2 px-3 py-3">
              <UserButton />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">Your account</p>
                <p className="text-xs text-foreground-3">Theme and access live here</p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-border/80 bg-background/70 px-5 py-4 backdrop-blur-xl lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  Workspace
                </p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                  Product docs that can survive change
                </h1>
              </div>

              <div className="flex items-center gap-2 lg:hidden">
                <Link href="/dashboard/docs/new">
                  <div className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 text-sm font-semibold text-white">
                    <Plus className="h-4 w-4" />
                    New
                  </div>
                </Link>
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
