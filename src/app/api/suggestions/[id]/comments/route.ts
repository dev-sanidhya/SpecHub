import { getAuthAndClient, ok, err } from "@/lib/api";
import { createNotification } from "@/lib/notifications";

// GET /api/suggestions/:id/comments
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, db } = await getAuthAndClient();
  if (error) return error;

  const { id } = await params;

  const { data, error: dbErr } = await db!
    .from("comments")
    .select("*")
    .eq("suggestion_id", id)
    .order("created_at", { ascending: true });

  if (dbErr) return err(dbErr.message, 500);
  return ok(data ?? []);
}

// POST /api/suggestions/:id/comments
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  const { id } = await params;
  const { body } = await req.json();

  if (!body?.trim()) return err("body required");

  const { data, error: dbErr } = await db!
    .from("comments")
    .insert({ suggestion_id: id, author_id: userId!, body })
    .select()
    .single();

  if (dbErr) return err(dbErr.message, 500);

  // Notify the suggestion author (if different from commenter)
  try {
    const { data: suggestion } = await db!
      .from("suggestions")
      .select("created_by, title, document_id")
      .eq("id", id)
      .single();
    const s = suggestion as { created_by: string; title: string; document_id: string } | null;
    if (s && s.created_by !== userId!) {
      const { data: doc } = await db!
        .from("documents")
        .select("workspace_id")
        .eq("id", s.document_id)
        .single();
      const wsId = (doc as { workspace_id: string } | null)?.workspace_id;
      if (wsId) {
        void createNotification(s.created_by, wsId, "comment_posted", {
          suggestion_id: id,
          suggestion_title: s.title,
          doc_id: s.document_id,
          actor_id: userId!,
        });
      }
    }
  } catch {
    // non-critical
  }

  return ok(data, 201);
}
