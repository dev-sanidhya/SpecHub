import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { LayoutDashboard, FileText, Settings, Plus } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0c0c0e] flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-[#1e1e24] bg-[#0e0e12] flex flex-col">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-[#1e1e24]">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-indigo-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="font-semibold text-[#f2f2f5]">SpecHub</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#a0a0b0] hover:text-[#f2f2f5] hover:bg-[#18181c] transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#a0a0b0] hover:text-[#f2f2f5] hover:bg-[#18181c] transition-colors"
          >
            <FileText className="w-4 h-4" />
            Documents
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#a0a0b0] hover:text-[#f2f2f5] hover:bg-[#18181c] transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </nav>

        {/* New doc button */}
        <div className="px-2 pb-2">
          <Link
            href="/dashboard/docs/new"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Document
          </Link>
        </div>

        {/* User */}
        <div className="px-4 py-4 border-t border-[#1e1e24] flex items-center gap-2">
          <UserButton />
          <span className="text-xs text-[#606070] truncate">Account</span>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
