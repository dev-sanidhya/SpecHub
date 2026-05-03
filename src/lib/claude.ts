import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Converts Tiptap JSON to readable plain text for Claude
export function tiptapToPlainText(content: unknown): string {
  if (!content || typeof content !== "object") return "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const node = content as any;

  if (node.type === "text") return node.text ?? "";

  if (node.type === "hardBreak") return "\n";

  if (!node.content || !Array.isArray(node.content)) return "";

  const children: string = node.content.map(tiptapToPlainText).join("");

  switch (node.type) {
    case "heading":
      return `${"#".repeat(node.attrs?.level ?? 1)} ${children}\n\n`;
    case "paragraph":
      return children ? `${children}\n\n` : "\n";
    case "bulletList":
    case "orderedList":
      return `${children}\n`;
    case "listItem":
      return `- ${children}`;
    case "blockquote":
      return `> ${children}\n`;
    case "codeBlock":
      return `\`\`\`\n${children}\n\`\`\`\n\n`;
    case "horizontalRule":
      return "---\n\n";
    default:
      return children;
  }
}

// Feature 1: Generate changelog when a suggestion is merged
export async function generateChangelog(
  oldContent: unknown,
  newContent: unknown,
  suggestionTitle: string,
  suggestionDescription: string | null
): Promise<string> {
  const oldText = tiptapToPlainText(oldContent).trim();
  const newText = tiptapToPlainText(newContent).trim();

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `You are writing a changelog entry for a product requirements document (PRD).

A suggestion titled "${suggestionTitle}" was merged${suggestionDescription ? ` with the reason: "${suggestionDescription}"` : ""}.

PREVIOUS VERSION:
${oldText}

NEW VERSION:
${newText}

Write a single, concise changelog paragraph (2-4 sentences max). Focus on:
- What actually changed (scope, requirements, flows, timelines)
- Why it matters (if the reason was given)
- Impact on the product

Do NOT use bullet points. Do NOT include a heading. Just the paragraph. Be direct and specific.`,
      },
    ],
  });

  const block = message.content[0];
  return block.type === "text" ? block.text.trim() : "";
}

// Feature 2: Detect contradictions in a PRD
export interface Contradiction {
  section1: string;
  section2: string;
  issue: string;
}

export async function detectContradictions(content: unknown): Promise<Contradiction[]> {
  const text = tiptapToPlainText(content).trim();
  if (text.length < 100) return [];

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `You are a product requirements analyst. Analyze this PRD for internal contradictions - places where the document says two conflicting things.

PRD:
${text}

Return a JSON array of contradictions. Each item must have:
- "section1": short quote or description of the first conflicting statement (max 60 chars)
- "section2": short quote or description of the second conflicting statement (max 60 chars)
- "issue": one sentence explaining the contradiction (max 100 chars)

If no contradictions found, return an empty array [].
Return ONLY valid JSON, no explanation.`,
      },
    ],
  });

  const block = message.content[0];
  if (block.type !== "text") return [];

  try {
    const raw = block.text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

// Feature 3: Plain-English summary of what changed between two versions
export async function summarizeDiff(
  oldContent: unknown,
  newContent: unknown
): Promise<string> {
  const oldText = tiptapToPlainText(oldContent).trim();
  const newText = tiptapToPlainText(newContent).trim();

  if (!oldText && !newText) return "";

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `Compare these two versions of a PRD and summarize what changed in 2-3 bullet points. Be specific and concise. Each bullet should be one short sentence. No intro text, just the bullets starting with "•".

BEFORE:
${oldText}

AFTER:
${newText}`,
      },
    ],
  });

  const block = message.content[0];
  return block.type === "text" ? block.text.trim() : "";
}
