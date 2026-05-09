import { getAuthAndClient, ok, err } from "@/lib/api";
import { detectContradictions } from "@/lib/claude";
import { checkRateLimit } from "@/lib/rateLimit";

// POST /api/documents/:id/check - run contradiction detection on current content
export async function POST(req: Request) {
  const { error, userId } = await getAuthAndClient();
  if (error) return error;

  const { allowed, remaining } = checkRateLimit(userId!, "contradiction-check", 20);
  if (!allowed) return err("Rate limit exceeded. You can run up to 20 AI checks per hour.", 429);
  void remaining; // available for response header if needed

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
