"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  GitPullRequest,
  Clock,
  ChevronRight,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils";

// Demo data - will be replaced with Supabase queries
const DEMO_DOCS = [
  {
    id: "1",
    title: "Authentication Flow PRD",
    current_version_number: 4,
    updated_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    open_suggestions: 2,
    created_by: "you",
  },
  {
    id: "2",
    title: "Onboarding Redesign Spec",
    current_version_number: 2,
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    open_suggestions: 0,
    created_by: "you",
  },
  {
    id: "3",
    title: "Notification System Requirements",
    current_version_number: 1,
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    open_suggestions: 1,
    created_by: "you",
  },
];

export default function DashboardPage() {
  const [search, setSearch] = useState("");

  const filtered = DEMO_DOCS.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#f2f2f5]">Documents</h1>
          <p className="text-sm text-[#606070] mt-0.5">
            {DEMO_DOCS.length} document{DEMO_DOCS.length !== 1 ? "s" : ""} in your workspace
          </p>
        </div>
        <Link href="/dashboard/docs/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            New Document
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
        <input
          type="text"
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 pl-9 pr-4 rounded-lg bg-[#111114] border border-[#2a2a32] text-sm text-[#f2f2f5] placeholder:text-[#606070] focus:outline-none focus:border-indigo-500/40 transition-colors"
        />
      </div>

      {/* Docs list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-10 h-10 text-[#363640] mx-auto mb-3" />
          <p className="text-[#606070] text-sm">No documents found</p>
          <Link href="/dashboard/docs/new" className="mt-4 inline-block">
            <Button size="sm" variant="secondary" className="gap-1.5 mt-3">
              <Plus className="w-3.5 h-3.5" />
              Create your first document
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <Link
              key={doc.id}
              href={`/dashboard/docs/${doc.id}`}
              className="flex items-center justify-between p-4 rounded-xl border border-[#1e1e24] bg-[#111114] hover:border-[#2a2a32] hover:bg-[#13131a] transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#18181c] border border-[#2a2a32] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-[#f2f2f5] truncate">
                    {doc.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-[#606070] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(doc.updated_at)}
                    </span>
                    <Badge variant="default">v{doc.current_version_number}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-4">
                {doc.open_suggestions > 0 && (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <GitPullRequest className="w-3 h-3" />
                    {doc.open_suggestions} open
                  </Badge>
                )}
                <ChevronRight className="w-4 h-4 text-[#363640] group-hover:text-[#606070] transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
