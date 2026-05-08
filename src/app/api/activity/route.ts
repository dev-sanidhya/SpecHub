import { getAuthAndClient, ok, err } from "@/lib/api";

// GET /api/activity - latest 60 workspace-level events (all members, all types)
export async function GET() {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  // Resolve workspace: owner first, then membership
  let workspaceId: string | null = null;

  const { data: owned } = await db!
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId!)
    .single();

  if (owned) {
    workspaceId = (owned as { id: string }).id;
  } else {
    const { data: membership } = await db!
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId!)
      .single();
    if (membership) {
      workspaceId = (membership as { workspace_id: string }).workspace_id;
    }
  }

  if (!workspaceId) return err("Workspace not found", 404);

  const { data, error: dbErr } = await db!
    .from("notifications")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(60);

  if (dbErr) return err(dbErr.message, 500);
  return ok(data ?? []);
}
