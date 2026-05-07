import { getAuthAndClient, ok, err } from "@/lib/api";

// GET /api/notifications - latest 30 for the current user
export async function GET() {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  const { data, error: dbErr } = await db!
    .from("notifications")
    .select("*")
    .eq("user_id", userId!)
    .order("created_at", { ascending: false })
    .limit(30);

  if (dbErr) return err(dbErr.message, 500);
  return ok(data ?? []);
}
