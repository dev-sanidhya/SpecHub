/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthAndClient, ok, err } from "@/lib/api";
import { summarizeDiff } from "@/lib/claude";

// POST /api/suggestions/:id/summary - generate plain-English diff summary
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, db } = await getAuthAndClient();
  if (error) return error;

  const { id } = await params;
  const { base_content, proposed_content } = await req.json();

  // If content passed directly, use it. Otherwise fetch from DB.
  let oldContent = base_content;
  let newContent = proposed_content;

  if (!oldContent || !newContent) {
    const { data: suggestion } = await db!
      .from("suggestions")
      .select("proposed_content, base_version_id")
      .eq("id", id)
      .single();

    const s = suggestion as any;
    if (!s) return err("Suggestion not found", 404);

    newContent = s.proposed_content;

    const { data: baseVersion } = await db!
      .from("versions")
      .select("content")
      .eq("id", s.base_version_id)
      .single();

    oldContent = (baseVersion as any)?.content ?? {};
  }

  try {
    const summary = await summarizeDiff(oldContent, newContent);
    return ok({ summary });
  } catch (e) {
    console.error("Diff summary failed:", e);
    return ok({ summary: null });
  }
}
