import { getAuthAndClient, ok, err } from "@/lib/api";

// GET /api/suggestions/mine?workspace_id=xxx
// Returns all suggestions created by the current user in the given workspace
export async function GET(req: Request) {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspace_id");

  if (!workspaceId) return err("workspace_id is required");

  // Get all document IDs in this workspace
  const { data: docs, error: docsErr } = await db!
    .from("documents")
    .select("id, title")
    .eq("workspace_id", workspaceId)
    .eq("archived", false);

  if (docsErr) return err(docsErr.message, 500);

  const docIds = (docs ?? []).map((d) => (d as { id: string }).id);
  if (docIds.length === 0) return ok([]);

  const docTitleMap: Record<string, string> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (docs ?? []).forEach((d: any) => { docTitleMap[d.id] = d.title; });

  const { data: suggestions, error: sErr } = await db!
    .from("suggestions")
    .select("id, title, description, status, created_at, document_id")
    .in("document_id", docIds)
    .eq("created_by", userId!)
    .order("created_at", { ascending: false });

  if (sErr) return err(sErr.message, 500);

  // Attach comment counts
  const rows = suggestions ?? [];
  const suggestionIds = rows.map((s) => (s as { id: string }).id);
  const commentCounts: Record<string, number> = {};

  if (suggestionIds.length > 0) {
    const { data: comments } = await db!
      .from("comments")
      .select("suggestion_id")
      .in("suggestion_id", suggestionIds);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (comments ?? []).forEach((c: any) => {
      commentCounts[c.suggestion_id] = (commentCounts[c.suggestion_id] ?? 0) + 1;
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ok(rows.map((s: any) => ({
    ...s,
    doc_title: docTitleMap[s.document_id] ?? "Unknown",
    comments: commentCounts[s.id] ?? 0,
  })));
}
