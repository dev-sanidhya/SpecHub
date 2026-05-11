import { getAuthAndClient, ok, err } from "@/lib/api";
import { tiptapToPlainText } from "@/lib/claude";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/documents/:id/suggestions/generate
// Given old_content + new_content, return an AI-generated suggestion title and description.
// This powers the auto-capture flow: the user edits freely, we name their change for them.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await getAuthAndClient();
  if (error) return error;

  // params referenced for route matching; id unused here but keeps the route scoped to a doc
  await params;

  const body = await req.json() as { old_content?: unknown; new_content?: unknown };
  const { old_content, new_content } = body;

  const oldText = tiptapToPlainText(old_content).trim().slice(0, 2000);
  const newText = tiptapToPlainText(new_content).trim().slice(0, 2000);

  if (!oldText && !newText) {
    return ok({ title: "Document update", description: null });
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 200,
      system: [
        {
          type: "text",
          text: 'You name product document changes for a review queue. Given before/after versions of a spec, output exactly one JSON object with two fields: "title" (5-10 words, imperative mood, specific - e.g. "Update auth flow to require email verification") and "description" (1-2 sentences: what changed and why it matters for the product). Return ONLY valid JSON, no markdown, no extra text.',
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `BEFORE:\n${oldText || "(empty)"}\n\nAFTER:\n${newText || "(empty)"}`,
        },
      ],
    });

    const block = message.content[0];
    if (block.type !== "text") return ok({ title: "Document update", description: null });

    const raw = block.text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(raw) as { title?: unknown; description?: unknown };

    return ok({
      title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : "Document update",
      description: typeof parsed.description === "string" ? parsed.description.trim() : null,
    });
  } catch {
    // Graceful fallback - the caller always gets something usable
    return ok({ title: "Document update", description: null });
  }
}
