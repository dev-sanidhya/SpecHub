/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthAndClient, ok, err } from "@/lib/api";

// GET /api/documents?workspace_id=xxx&q=search
export async function GET(req: Request) {
  const { error, db } = await getAuthAndClient();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspace_id");
  if (!workspaceId) return err("workspace_id required");

  const q = searchParams.get("q")?.trim() ?? "";

  let query = db!
    .from("documents")
    .select("id, title, current_version_number, created_by, created_at, updated_at")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });

  if (q) {
    // Search title and content_text with case-insensitive substring match
    query = query.or(`title.ilike.%${q}%,content_text.ilike.%${q}%`);
  }

  const { data, error: dbErr } = await query;

  if (dbErr) return err(dbErr.message, 500);

  const rows: any[] = data ?? [];
  const docIds: string[] = rows.map((d) => d.id);
  const suggestionCounts: Record<string, number> = {};

  if (docIds.length > 0) {
    const { data: suggestions } = await db!
      .from("suggestions")
      .select("document_id")
      .in("document_id", docIds)
      .eq("status", "open");

    (suggestions ?? []).forEach((s: any) => {
      suggestionCounts[s.document_id] = (suggestionCounts[s.document_id] ?? 0) + 1;
    });
  }

  return ok(rows.map((d) => ({ ...d, open_suggestions: suggestionCounts[d.id] ?? 0 })));
}

// POST /api/documents
export async function POST(req: Request) {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  const body = await req.json();
  const { workspace_id, title } = body;
  if (!workspace_id) return err("workspace_id required");

  const { data: doc, error: docErr } = await db!
    .from("documents")
    .insert({ workspace_id, title: title || "Untitled", created_by: userId! })
    .select()
    .single();

  if (docErr) return err(docErr.message, 500);

  const { data: version, error: verErr } = await db!
    .from("versions")
    .insert({
      document_id: (doc as any).id,
      content: { type: "doc", content: [] },
      version_number: 1,
      created_by: userId!,
    })
    .select()
    .single();

  if (verErr) return err(verErr.message, 500);

  await db!
    .from("documents")
    .update({ current_version_id: (version as any).id, current_version_number: 1 })
    .eq("id", (doc as any).id);

  return ok({ ...(doc as any), current_version_id: (version as any).id, current_version_number: 1 }, 201);
}
