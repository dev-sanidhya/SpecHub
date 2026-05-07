import { getAuthAndClient, ok, err } from "@/lib/api";

// DELETE /api/workspace/invites/[token] - revoke an invite
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  const { token } = await params;

  const { data: ws } = await db!
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId!)
    .single();

  if (!ws) return err("Not workspace owner", 403);

  const { error: dbErr } = await db!
    .from("workspace_invites")
    .delete()
    .eq("token", token)
    .eq("workspace_id", (ws as { id: string }).id);

  if (dbErr) return err(dbErr.message, 500);
  return ok({ deleted: true });
}
