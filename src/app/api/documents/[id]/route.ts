import { getAuthAndClient, ok, err } from "@/lib/api";

// GET /api/documents/:id - fetch doc + current version content
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, db } = await getAuthAndClient();
  if (error) return error;

  const { id } = await params;

  const { data: doc, error: docErr } = await db!
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (docErr || !doc) return err(docErr?.message ?? "Not found", 404);

  const docRow = doc as Record<string, unknown>;

  // Fetch current version content
  let currentVersion = null;
  const versionId = docRow.current_version_id as string | null;
  if (versionId) {
    const { data: ver } = await db!
      .from("versions")
      .select("*")
      .eq("id", versionId)
      .single();
    currentVersion = ver;
  }

  return ok({ ...docRow, currentVersion });
}

// PATCH /api/documents/:id - update title
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, db } = await getAuthAndClient();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { title } = body;

  const { data, error: dbErr } = await db!
    .from("documents")
    .update({ title })
    .eq("id", id)
    .select()
    .single();

  if (dbErr) return err(dbErr.message, 500);
  return ok(data);
}
