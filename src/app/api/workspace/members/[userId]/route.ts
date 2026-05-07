import { getAuthAndClient, ok, err } from "@/lib/api";

// DELETE /api/workspace/members/[userId] - remove a member (owner only)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  const { userId: targetUserId } = await params;

  if (targetUserId === userId!) return err("Cannot remove yourself", 400);

  const { data: ws } = await db!
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId!)
    .single();

  if (!ws) return err("Not workspace owner", 403);

  const { error: dbErr } = await db!
    .from("workspace_members")
    .delete()
    .eq("workspace_id", (ws as { id: string }).id)
    .eq("user_id", targetUserId);

  if (dbErr) return err(dbErr.message, 500);
  return ok({ removed: true });
}
