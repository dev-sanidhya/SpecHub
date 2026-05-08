import { getAuthAndClient, err } from "@/lib/api";
import { tiptapToMarkdown } from "@/lib/tiptapToMarkdown";

// GET /api/documents/:id/export - download doc as Markdown
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, db } = await getAuthAndClient();
  if (error) return error;

  // Fetch document
  const { data: doc, error: docErr } = await db!
    .from("documents")
    .select("id, title, current_version_id")
    .eq("id", id)
    .single();

  if (docErr || !doc) return err("Not found", 404);

  // Fetch current version content
  let content: object | null = null;
  if (doc.current_version_id) {
    const { data: ver } = await db!
      .from("versions")
      .select("content")
      .eq("id", doc.current_version_id)
      .single();
    if (ver) content = ver.content as object;
  }

  const markdown = tiptapToMarkdown(content);
  const slug = (doc.title as string)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const filename = `${slug || "document"}.md`;

  return new Response(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
