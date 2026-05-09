import { getAuthAndClient, ok, err } from "@/lib/api";

// GET /api/workspaces - list all workspaces the user owns or is a member of
export async function GET() {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  // Owned workspaces
  const { data: owned } = await db!
    .from("workspaces")
    .select("id, name, owner_id, created_at")
    .eq("owner_id", userId!);

  // Member workspaces
  const { data: memberships } = await db!
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId!);

  const memberWsIds = (memberships ?? [])
    .map((m: { workspace_id: string }) => m.workspace_id)
    .filter((wsId: string) => !(owned ?? []).some((w: { id: string }) => w.id === wsId));

  let memberWorkspaces: unknown[] = [];
  if (memberWsIds.length > 0) {
    const { data: mws } = await db!
      .from("workspaces")
      .select("id, name, owner_id, created_at")
      .in("id", memberWsIds);
    memberWorkspaces = mws ?? [];
  }

  const all = [
    ...(owned ?? []).map((w: { id: string; name: string; owner_id: string; created_at: string }) => ({ ...w, role: "owner" })),
    ...memberWorkspaces.map((w) => ({ ...(w as object), role: "editor" })),
  ];

  return ok(all);
}

// POST /api/workspaces - create a new workspace
export async function POST(req: Request) {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  const body = await req.json() as { name?: string };
  const name = (body.name ?? "").trim() || "New Workspace";

  const { data: ws, error: wsErr } = await db!
    .from("workspaces")
    .insert({ name, owner_id: userId! })
    .select()
    .single();

  if (wsErr) return err(wsErr.message, 500);

  // Add creator as owner in members table too
  await db!.from("workspace_members").insert({
    workspace_id: (ws as { id: string }).id,
    user_id: userId!,
    role: "owner",
  });

  return ok(ws, 201);
}
