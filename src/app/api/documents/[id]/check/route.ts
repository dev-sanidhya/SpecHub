import { getAuthAndClient, ok, err } from "@/lib/api";
import { detectContradictions } from "@/lib/claude";

// POST /api/documents/:id/check - run contradiction detection on current content
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await getAuthAndClient();
  if (error) return error;

  const { content } = await req.json();
  if (!content) return err("content required");

  try {
    const contradictions = await detectContradictions(content);
    return ok({ contradictions });
  } catch (e) {
    console.error("Contradiction detection failed:", e);
    return ok({ contradictions: [] });
  }
}
