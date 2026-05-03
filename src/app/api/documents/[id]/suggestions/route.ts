import { getAuthAndClient, ok, err } from "@/lib/api";

// GET /api/documents/:id/suggestions
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, db } = await getAuthAndClient();
  if (error) return error;

  const { id } = await params;

  const { data, error: dbErr } = await db!
    .from("suggestions")
    .select("id, title, description, status, created_by, created_at")
    .eq("document_id", id)
    .order("created_at", { ascending: false });

  if (dbErr) return err(dbErr.message, 500);

  // Attach comment counts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = data ?? [];
  const suggestionIds = rows.map((s) => s.id as string);
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

  return ok(rows.map((s) => ({ ...s, comments: commentCounts[s.id] ?? 0 })));
}

// POST /api/documents/:id/suggestions - create a suggestion
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  const { id } = await params;
  const { title, description, proposed_content, base_version_id } = await req.json();

  if (!title || !proposed_content || !base_version_id) {
    return err("title, proposed_content, and base_version_id are required");
  }

  const { data, error: dbErr } = await db!
    .from("suggestions")
    .insert({
      document_id: id,
      base_version_id,
      proposed_content,
      title,
      description: description ?? null,
      created_by: userId!,
    })
    .select()
    .single();

  if (dbErr) return err(dbErr.message, 500);
  return ok(data, 201);
}
