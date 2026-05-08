import { getAuthAndClient, ok, err } from "@/lib/api";

// POST /api/suggestions/:id/share - generate (or return existing) share token
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, db } = await getAuthAndClient();
  if (error) return error;

  // Fetch suggestion to confirm it exists
  const { data: suggestion, error: sErr } = await db!
    .from("suggestions")
    .select("id, share_token")
    .eq("id", id)
    .single();

  if (sErr || !suggestion) return err("Suggestion not found", 404);

  // Return existing token if already generated
  const existing = (suggestion as { id: string; share_token: string | null }).share_token;
  if (existing) {
    return ok({ token: existing });
  }

  // Generate a new token
  const token = crypto.randomUUID().replace(/-/g, "");

  const { error: updateErr } = await db!
    .from("suggestions")
    .update({ share_token: token })
    .eq("id", id);

  if (updateErr) return err(updateErr.message, 500);

  return ok({ token });
}
