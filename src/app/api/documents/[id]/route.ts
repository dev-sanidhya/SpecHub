import { getAuthAndClient, ok, err } from "@/lib/api";

async function loadOwnedDocument(id: string) {
  const { error, userId, db } = await getAuthAndClient();
  if (error) {
    return { response: error, doc: null, db: null };
  }

  const { data: doc, error: docErr } = await db!
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (docErr || !doc) {
    return { response: err(docErr?.message ?? "Not found", 404), doc: null, db: null };
  }

  if (doc.created_by !== userId) {
    return { response: err("Forbidden", 403), doc: null, db: null };
  }

  return { response: null, doc, db: db!, userId };
}

// GET /api/documents/:id - fetch doc + current version content
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { response, doc, db } = await loadOwnedDocument(id);
  if (response) return response;

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

// PATCH /api/documents/:id - update title and/or archived state
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { response, db } = await loadOwnedDocument(id);
  if (response) return response;

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (typeof body.title === "string") updates.title = body.title;
  if (typeof body.archived === "boolean") updates.archived = body.archived;
  if (Array.isArray(body.tags)) updates.tags = body.tags.map(String).slice(0, 10);

  if (Object.keys(updates).length === 0) return err("Nothing to update", 400);

  const { data, error: dbErr } = await db!
    .from("documents")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (dbErr) return err(dbErr.message, 500);
  return ok(data);
}

// DELETE /api/documents/:id - delete document and cascaded records
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { response, db } = await loadOwnedDocument(id);
  if (response) return response;

  const { error: dbErr } = await db!.from("documents").delete().eq("id", id);

  if (dbErr) return err(dbErr.message, 500);
  return ok({ success: true });
}
