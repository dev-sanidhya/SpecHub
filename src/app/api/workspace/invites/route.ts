import { getAuthAndClient, ok, err } from "@/lib/api";

// GET /api/workspace/invites - list pending (non-expired, non-accepted) invites
export async function GET() {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  const { data: ws } = await db!
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId!)
    .single();

  if (!ws) return err("Not workspace owner", 403);

  const { data, error: dbErr } = await db!
    .from("workspace_invites")
    .select("id, email, token, created_at, expires_at")
    .eq("workspace_id", (ws as { id: string }).id)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (dbErr) return err(dbErr.message, 500);
  return ok(data ?? []);
}

// POST /api/workspace/invites - create an invite link
export async function POST(request: Request) {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  const body = (await request.json()) as { email?: unknown };
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) return err("Valid email is required", 400);

  const { data: ws } = await db!
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId!)
    .single();

  if (!ws) return err("Not workspace owner", 403);

  const wsId = (ws as { id: string }).id;

  // Invalidate any existing open invite for this email
  await db!
    .from("workspace_invites")
    .delete()
    .eq("workspace_id", wsId)
    .eq("email", email)
    .is("accepted_at", null);

  const token = crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error: dbErr } = await db!
    .from("workspace_invites")
    .insert({
      workspace_id: wsId,
      email,
      token,
      invited_by: userId!,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (dbErr) return err(dbErr.message, 500);
  return ok(data, 201);
}
