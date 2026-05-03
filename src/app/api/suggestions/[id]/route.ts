import { getAuthAndClient, ok, err } from "@/lib/api";

// GET /api/suggestions/:id - full suggestion with base version content
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, db } = await getAuthAndClient();
  if (error) return error;

  const { id } = await params;

  const { data: suggestion, error: sErr } = await db!
    .from("suggestions")
    .select("*")
    .eq("id", id)
    .single();

  if (sErr) return err(sErr.message, 404);

  // Fetch base version content for diff
  const { data: baseVersion } = await db!
    .from("versions")
    .select("content, version_number")
    .eq("id", suggestion.base_version_id)
    .single();

  return ok({ ...suggestion, baseVersion });
}

// PATCH /api/suggestions/:id - update status (approve/reject/merge)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  const { id } = await params;
  const { status } = await req.json();

  if (!["open", "approved", "rejected", "merged"].includes(status)) {
    return err("Invalid status");
  }

  // If merging: create a new version from the proposed_content
  if (status === "merged") {
    const { data: suggestion } = await db!
      .from("suggestions")
      .select("document_id, proposed_content")
      .eq("id", id)
      .single();

    if (suggestion) {
      const { data: doc } = await db!
        .from("documents")
        .select("current_version_number")
        .eq("id", suggestion.document_id)
        .single();

      const nextNumber = (doc?.current_version_number ?? 0) + 1;

      const { data: newVersion } = await db!
        .from("versions")
        .insert({
          document_id: suggestion.document_id,
          content: suggestion.proposed_content,
          version_number: nextNumber,
          created_by: userId!,
        })
        .select()
        .single();

      if (newVersion) {
        await db!
          .from("documents")
          .update({
            current_version_id: newVersion.id,
            current_version_number: nextNumber,
          })
          .eq("id", suggestion.document_id);
      }
    }
  }

  const { data, error: dbErr } = await db!
    .from("suggestions")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (dbErr) return err(dbErr.message, 500);
  return ok(data);
}
