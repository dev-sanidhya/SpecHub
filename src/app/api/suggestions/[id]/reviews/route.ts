import { getAuthAndClient, ok, err } from "@/lib/api";

// GET /api/suggestions/:id/reviews
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, db } = await getAuthAndClient();
  if (error) return error;

  const { id } = await params;

  const { data, error: dbErr } = await db!
    .from("reviews")
    .select("*")
    .eq("suggestion_id", id)
    .order("created_at", { ascending: true });

  if (dbErr) return err(dbErr.message, 500);
  return ok(data ?? []);
}

// POST /api/suggestions/:id/reviews - submit a review
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  const { id } = await params;
  const { decision, comment } = await req.json();

  if (!["approved", "rejected", "changes_requested"].includes(decision)) {
    return err("decision must be approved, rejected, or changes_requested");
  }

  // Upsert - one review per reviewer per suggestion
  const { data, error: dbErr } = await db!
    .from("reviews")
    .upsert(
      { suggestion_id: id, reviewer_id: userId!, decision, comment: comment ?? null },
      { onConflict: "suggestion_id,reviewer_id" }
    )
    .select()
    .single();

  if (dbErr) return err(dbErr.message, 500);
  return ok(data, 201);
}
