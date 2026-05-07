/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Server-safe plain text extraction from Tiptap JSON.
 * Mirrors the jsonToText function in DiffView.tsx but runs in Node (no React imports).
 */
function nodeToText(node: any): string {
  if (!node) return "";
  if (node.type === "text") return node.text ?? "";
  if (!node.content) return "";
  const sep = node.type === "paragraph" || node.type === "heading" ? "\n" : "";
  return node.content.map(nodeToText).join("") + sep;
}

export function tiptapToText(content: object | null | undefined): string {
  if (!content) return "";
  try {
    const doc = content as any;
    if (!doc.content) return "";
    return doc.content
      .map((node: object) => nodeToText(node))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch {
    return "";
  }
}
