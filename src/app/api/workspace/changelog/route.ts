import { getAuthAndClient, ok, err } from "@/lib/api";

// GET /api/workspace/changelog?workspace_id=xxx
// Returns the 8 most recent merged versions that have an AI summary,
// enriched with their parent document title.
// Powers the "Recent changes" changelog section on the dashboard.
export async function GET(req: Request) {
  const { error, db } = await getAuthAndClient();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspace_id");
  if (!workspaceId) return err("workspace_id required");

  // Fetch all docs in this workspace (non-archived)
  const { data: docs, error: docsErr } = await db!
    .from("documents")
    .select("id, title")
    .eq("workspace_id", workspaceId)
    .eq("archived", false);

  if (docsErr) return err(docsErr.message, 500);

  const docList = (docs ?? []) as { id: string; title: string }[];
  if (docList.length === 0) return ok([]);

  const docIds = docList.map((d) => d.id);
  const docMap: Record<string, string> = {};
  docList.forEach((d) => { docMap[d.id] = d.title; });

  // Fetch recent versions that have an AI-generated summary
  const { data: versions, error: verErr } = await db!
    .from("versions")
    .select("id, version_number, ai_summary, created_by, created_at, document_id")
    .in("document_id", docIds)
    .not("ai_summary", "is", null)
    .order("created_at", { ascending: false })
    .limit(8);

  if (verErr) return err(verErr.message, 500);

  const rows = (versions ?? []) as {
    id: string;
    version_number: number;
    ai_summary: string;
    created_by: string;
    created_at: string;
    document_id: string;
  }[];

  return ok(
    rows.map((v) => ({
      ...v,
      doc_title: docMap[v.document_id] ?? "Untitled",
    }))
  );
}
