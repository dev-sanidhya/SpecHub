import { getAuthAndClient, ok, err } from "@/lib/api";

// Allow any workspace member (or creator) to read a document.
// Mutations (PATCH, DELETE) still require ownership.
async function loadDocForMember(id: string) {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return { response: error, doc: null, db: null, userId: null };

  const { data: doc, error: docErr } = await db!
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (docErr || !doc) {
    return { response: err(docErr?.message ?? "Not found", 404), doc: null, db: null, userId: null };
  }

  const docRow = doc as Record<string, unknown>;
  const isCreator = docRow.created_by === userId;

  if (!isCreator) {
    const { data: membership } = await db!
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", docRow.workspace_id as string)
      .eq("user_id", userId!)
      .single();

    if (!membership) {
      return { response: err("Forbidden", 403), doc: null, db: null, userId: null };
    }
  }

  return { response: null, doc: docRow, db: db!, userId };
}

// Require ownership for mutations.
async function loadOwnedDocument(id: string) {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return { response: error, doc: null, db: null, userId: null };

  const { data: doc, error: docErr } = await db!
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (docErr || !doc) {
    return { response: err(docErr?.message ?? "Not found", 404), doc: null, db: null, userId: null };
  }

  const docRow = doc as Record<string, unknown>;
  if (docRow.created_by !== userId) {
    return { response: err("Forbidden", 403), doc: null, db: null, userId: null };
  }

  return { response: null, doc: docRow, db: db!, userId };
}

// GET /api/documents/:id - fetch doc + current version content
// Accessible by the creator OR any workspace member.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { response, doc, db } = await loadDocForMember(id);
  if (response) return response;

  let currentVersion = null;
  const versionId = doc!.current_version_id as string | null;
  if (versionId) {
    const { data: ver } = await db!
      .from("versions")
      .select("*")
      .eq("id", versionId)
      .single();
    currentVersion = ver;
  }

  return ok({ ...doc, currentVersion });
}

// PATCH /api/documents/:id - owner-only mutations
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { response, db } = await loadOwnedDocument(id);
  if (response) return response;

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (typeof body.title === "string") updates.title = body.title;
  if (typeof body.archived === "boolean") updates.archived = body.archived;
  if (Array.isArray(body.tags)) updates.tags = body.tags.map(String).slice(0, 10);
  if (typeof body.min_approvals === "number") updates.min_approvals = Math.max(1, Math.min(10, body.min_approvals));
  if (body.required_reviewer_id !== undefined) updates.required_reviewer_id = body.required_reviewer_id || null;
  if (
    typeof body.protection_mode === "string" &&
    ["open", "soft", "hard"].includes(body.protection_mode)
  ) {
    updates.protection_mode = body.protection_mode;
  }

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

// DELETE /api/documents/:id - owner-only
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { response, db } = await loadOwnedDocument(id);
  if (response) return response;

  const { error: dbErr } = await db!.from("documents").delete().eq("id", id);
  if (dbErr) return err(dbErr.message, 500);
  return ok({ success: true });
}
