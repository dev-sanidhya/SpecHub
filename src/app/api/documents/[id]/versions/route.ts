import { getAuthAndClient, ok, err } from "@/lib/api";
import { tiptapToText } from "@/lib/tiptapToText";

// GET /api/documents/:id/versions - all versions for a doc
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, db } = await getAuthAndClient();
  if (error) return error;

  const { id } = await params;

  const { data, error: dbErr } = await db!
    .from("versions")
    .select("id, version_number, ai_summary, created_by, created_at")
    .eq("document_id", id)
    .order("version_number", { ascending: false });

  if (dbErr) return err(dbErr.message, 500);
  return ok(data ?? []);
}

// POST /api/documents/:id/versions - save a new version (direct save, not via suggestion)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  const { id } = await params;
  const { content } = await req.json();
  if (!content) return err("content required");

  // Load doc to check ownership and protection mode
  const { data: doc } = await db!
    .from("documents")
    .select("current_version_number, created_by, protection_mode")
    .eq("id", id)
    .single();

  // Hard-protected docs: only the creator can save versions directly
  if (doc?.protection_mode === "hard" && doc?.created_by !== userId) {
    return err(
      "This document is protected. Your changes must go through a suggestion for review.",
      403
    );
  }

  const nextNumber = (doc?.current_version_number ?? 0) + 1;

  const { data: version, error: verErr } = await db!
    .from("versions")
    .insert({
      document_id: id,
      content,
      version_number: nextNumber,
      created_by: userId!,
    })
    .select()
    .single();

  if (verErr) return err(verErr.message, 500);

  // Update document pointer + searchable text
  await db!
    .from("documents")
    .update({
      current_version_id: version.id,
      current_version_number: nextNumber,
      content_text: tiptapToText(content),
    })
    .eq("id", id);

  return ok(version, 201);
}
