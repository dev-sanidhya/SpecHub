import { getAuthAndClient, err } from "@/lib/api";
import { tiptapToPDF } from "@/lib/tiptapToPDF";

// Force Node.js runtime - @react-pdf/renderer requires Node APIs
export const runtime = "nodejs";

// GET /api/documents/:id/pdf - download doc as PDF
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, db } = await getAuthAndClient();
  if (error) return error;

  // Fetch document + current version number
  const { data: doc, error: docErr } = await db!
    .from("documents")
    .select("id, title, current_version_id, current_version_number")
    .eq("id", id)
    .single();

  if (docErr || !doc) return err("Not found", 404);

  // Fetch current version content
  let content: object = { type: "doc", content: [] };
  if (doc.current_version_id) {
    const { data: ver } = await db!
      .from("versions")
      .select("content, created_at")
      .eq("id", doc.current_version_id)
      .single();
    if (ver?.content) content = ver.content as object;
  }

  const title = (doc.title as string) || "Untitled";
  const versionNumber = (doc.current_version_number as number) ?? 1;

  const pdfStream = await tiptapToPDF(title, versionNumber, content);

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const filename = `${slug || "document"}-v${versionNumber}.pdf`;

  return new Response(pdfStream as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
