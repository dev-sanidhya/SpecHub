"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  GitPullRequest,
  Clock,
  ChevronRight,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils";

interface Doc {
  id: string;
  title: string;
  current_version_number: number;
  updated_at: string;
  open_suggestions: number;
  created_by: string;
}

interface Workspace {
  id: string;
  name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Get or create workspace
      const wsRes = await fetch("/api/workspace");
      const ws = await wsRes.json();
      setWorkspace(ws);

      // Fetch docs for this workspace
      const docsRes = await fetch(`/api/documents?workspace_id=${ws.id}`);
      const docsData = await docsRes.json();
      setDocs(docsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function createDoc() {
    if (!workspace) return;
    setCreating(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspace.id, title: "Untitled" }),
      });
      const doc = await res.json();
      router.push(`/dashboard/docs/${doc.id}`);
    } catch (e) {
      console.error(e);
      setCreating(false);
    }
  }

  const filtered = docs.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#f2f2f5]">Documents</h1>
          <p className="text-sm text-[#606070] mt-0.5">
            {loading ? "Loading..." : `${docs.length} document${docs.length !== 1 ? "s" : ""} in your workspace`}
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={createDoc} loading={creating}>
          <Plus className="w-4 h-4" />
          New Document
        </Button>
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

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-[#363640] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-10 h-10 text-[#363640] mx-auto mb-3" />
          <p className="text-[#606070] text-sm">
            {search ? "No documents match your search" : "No documents yet"}
          </p>
          {!search && (
            <Button size="sm" variant="secondary" className="gap-1.5 mt-4" onClick={createDoc} loading={creating}>
              <Plus className="w-3.5 h-3.5" />
              Create your first document
            </Button>
          )}
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
                  <h3 className="text-sm font-medium text-[#f2f2f5] truncate">{doc.title}</h3>
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
