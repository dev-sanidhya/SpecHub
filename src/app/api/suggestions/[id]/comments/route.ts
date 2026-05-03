import { getAuthAndClient, ok, err } from "@/lib/api";

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
  return ok(data, 201);
}
