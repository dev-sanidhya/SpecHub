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

// GET /api/workspace - fetch or create the user's personal workspace
export async function GET() {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  // Try to find existing workspace owned by this user
  const { data: existing, error: fetchErr } = await db!
    .from("workspaces")
    .select("*")
    .eq("owner_id", userId!)
    .single();

  if (fetchErr && fetchErr.code !== "PGRST116") {
    return err(fetchErr.message, 500);
  }

  if (existing) return ok(existing);

  // First login - create personal workspace
  const { data: created, error: createErr } = await db!
    .from("workspaces")
    .insert({ name: "My Workspace", owner_id: userId! })
    .select()
    .single();

  if (createErr) return err(createErr.message, 500);

  // Also add as owner member
  await db!.from("workspace_members").insert({
    workspace_id: created.id,
    user_id: userId!,
    role: "owner",
  });

  return ok(created, 201);
}
