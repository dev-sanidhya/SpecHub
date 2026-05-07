/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { clerkClient } from "@clerk/nextjs/server";

// GET /api/invite/[token] - public route, no auth required
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const db = createServerClient();

  const { data: invite, error } = await db
    .from("workspace_invites")
    .select("*, workspaces(name)")
    .eq("token", token)
    .is("accepted_at", null)
    .single();

  if (error || !invite) {
    return NextResponse.json(
      { error: "Invite not found or already used" },
      { status: 404 }
    );
  }

  if (new Date((invite as any).expires_at) < new Date()) {
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
  }

  let inviterName = "A team member";
  try {
    const client = await clerkClient();
    const inviter = await client.users.getUser((invite as any).invited_by);
    inviterName =
      [inviter.firstName, inviter.lastName].filter(Boolean).join(" ").trim() ||
      inviter.username ||
      "A team member";
  } catch {
    // non-critical
  }

  return NextResponse.json({
    token: (invite as any).token,
    email: (invite as any).email,
    workspaceId: (invite as any).workspace_id,
    workspaceName: (invite as any).workspaces?.name ?? "Workspace",
    inviterName,
    expiresAt: (invite as any).expires_at,
  });
}
