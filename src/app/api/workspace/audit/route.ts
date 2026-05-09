import { getAuthAndClient, err } from "@/lib/api";

// GET /api/workspace/audit?format=json|csv
// Returns workspace activity log for owners
export async function GET(req: Request) {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "json";

  // Resolve workspace (must be owner)
  const { data: ws } = await db!
    .from("workspaces")
    .select("id, name")
    .eq("owner_id", userId!)
    .single();

  if (!ws) return err("Only workspace owners can export the audit log.", 403);

  const workspace = ws as { id: string; name: string };

  // Fetch all notifications for this workspace (serves as the activity/audit log)
  const { data: events, error: evErr } = await db!
    .from("notifications")
    .select("id, user_id, type, payload, created_at, read")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(2000);

  if (evErr) return err(evErr.message, 500);

  const rows = (events ?? []) as {
    id: string;
    user_id: string;
    type: string;
    payload: Record<string, unknown>;
    created_at: string;
    read: boolean;
  }[];

  if (format === "csv") {
    const header = "id,timestamp,type,user_id,actor_id,doc_id,suggestion_id,extra\n";
    const lines = rows.map((r) => {
      const p = r.payload ?? {};
      const cols = [
        r.id,
        r.created_at,
        r.type,
        r.user_id,
        (p.actor_id as string) ?? "",
        (p.doc_id as string) ?? "",
        (p.suggestion_id as string) ?? "",
        JSON.stringify(p).replace(/"/g, "'"),
      ].map((c) => `"${c}"`);
      return cols.join(",");
    });
    const csv = header + lines.join("\n");
    const filename = `${workspace.name.toLowerCase().replace(/\s+/g, "-")}-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  return new Response(JSON.stringify(rows), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
