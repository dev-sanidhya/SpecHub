/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthAndClient, ok, err } from "@/lib/api";
import { clerkClient } from "@clerk/nextjs/server";

// GET /api/workspace/members - list all members with Clerk info
export async function GET() {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  // Find the workspace this user belongs to (as owner or member)
  let workspaceId: string | null = null;

  const { data: ownedWs } = await db!
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId!)
    .single();

  if (ownedWs) {
    workspaceId = (ownedWs as any).id;
  } else {
    const { data: mem } = await db!
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId!)
      .single();
    if (mem) workspaceId = (mem as any).workspace_id;
  }

  if (!workspaceId) return err("No workspace found", 404);

  const { data: members, error: dbErr } = await db!
    .from("workspace_members")
    .select("user_id, role, joined_at")
    .eq("workspace_id", workspaceId)
    .order("joined_at", { ascending: true });

  if (dbErr) return err(dbErr.message, 500);

  const client = await clerkClient();
  const enriched = await Promise.all(
    (members ?? []).map(async (m: any) => {
      try {
        const user = await client.users.getUser(m.user_id);
        const name =
          [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
          user.username ||
          user.emailAddresses[0]?.emailAddress?.split("@")[0] ||
          `user_${m.user_id.slice(0, 6)}`;
        return {
          user_id: m.user_id,
          role: m.role,
          joined_at: m.joined_at,
          name,
          imageUrl: user.imageUrl ?? null,
          email: user.emailAddresses[0]?.emailAddress ?? null,
        };
      } catch {
        return {
          user_id: m.user_id,
          role: m.role,
          joined_at: m.joined_at,
          name: `user_${m.user_id.slice(0, 6)}`,
          imageUrl: null,
          email: null,
        };
      }
    })
  );

  return ok(enriched);
}
