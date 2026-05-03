import { getAuthAndClient, ok, err } from "@/lib/api";

// GET /api/documents/:id/versions/:vid - fetch full content of a specific version
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; vid: string }> }
) {
  const { error, db } = await getAuthAndClient();
  if (error) return error;

  const { vid } = await params;

  const { data, error: dbErr } = await db!
    .from("versions")
    .select("*")
    .eq("id", vid)
    .single();

  if (dbErr) return err(dbErr.message, 404);
  return ok(data);
}
