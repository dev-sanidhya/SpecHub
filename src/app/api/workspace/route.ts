import { getAuthAndClient, ok, err } from "@/lib/api";

// PATCH /api/workspace - rename the user's workspace
export async function PATCH(request: Request) {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  const body = await request.json() as { name?: unknown };
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return err("Name is required", 400);

  const { data, error: updateErr } = await db!
    .from("workspaces")
    .update({ name })
    .eq("owner_id", userId!)
    .select()
    .single();

  if (updateErr) return err(updateErr.message, 500);
  return ok(data);
}

// GET /api/workspace - fetch or create the user's workspace
// Supports both workspace owners and invited members
export async function GET() {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  // 1. Check if this user owns a workspace
  const { data: owned, error: ownedErr } = await db!
    .from("workspaces")
    .select("*")
    .eq("owner_id", userId!)
    .single();

  if (ownedErr && ownedErr.code !== "PGRST116") return err(ownedErr.message, 500);
  if (owned) return ok(owned);

  // 2. Check if this user is a member of any workspace
  const { data: membership } = await db!
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId!)
    .single();

  if (membership) {
    const { data: memberWs, error: wsErr } = await db!
      .from("workspaces")
      .select("*")
      .eq("id", (membership as { workspace_id: string }).workspace_id)
      .single();
    if (wsErr) return err(wsErr.message, 500);
    if (memberWs) return ok(memberWs);
  }

  // 3. First login - create personal workspace
  const { data: created, error: createErr } = await db!
    .from("workspaces")
    .insert({ name: "My Workspace", owner_id: userId! })
    .select()
    .single();

  if (createErr) return err(createErr.message, 500);

  await db!.from("workspace_members").insert({
    workspace_id: (created as { id: string }).id,
    user_id: userId!,
    role: "owner",
  });

  return ok(created, 201);
}
