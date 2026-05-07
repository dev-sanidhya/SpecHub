/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthAndClient, ok, err } from "@/lib/api";

// POST /api/invite/[token]/accept - join the workspace via invite
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  const { token } = await params;

  const { data: invite, error: inviteErr } = await db!
    .from("workspace_invites")
    .select("*")
    .eq("token", token)
    .is("accepted_at", null)
    .single();

  if (inviteErr || !invite) return err("Invite not found or already used", 404);

  if (new Date((invite as any).expires_at) < new Date()) {
    return err("Invite has expired", 410);
  }

  const workspaceId = (invite as any).workspace_id;

  // Idempotent - check if already a member
  const { data: existing } = await db!
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId!)
    .single();

  if (!existing) {
    await db!.from("workspace_members").insert({
      workspace_id: workspaceId,
      user_id: userId!,
      role: "editor",
    });
  }

  // Mark accepted
  await db!
    .from("workspace_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("token", token);

  return ok({ workspaceId });
}
