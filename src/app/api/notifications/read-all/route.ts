import { getAuthAndClient, ok, err } from "@/lib/api";

// POST /api/notifications/read-all
export async function POST() {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  const { error: dbErr } = await db!
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId!)
    .eq("read", false);

  if (dbErr) return err(dbErr.message, 500);
  return ok({ ok: true });
}
