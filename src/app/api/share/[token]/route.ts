import { createServerClient } from "@/lib/supabase";
import { ok, err } from "@/lib/api";

// GET /api/share/:token - public endpoint, no auth required
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = createServerClient();

  const { data: suggestion, error: sErr } = await db
    .from("suggestions")
    .select("id, title, description, status, created_by, created_at, proposed_content, base_version_id, document_id")
    .eq("share_token", token)
    .single();

  if (sErr || !suggestion) return err("Not found", 404);

  const s = suggestion as {
    id: string;
    title: string;
    description: string | null;
    status: string;
    created_by: string;
    created_at: string;
    proposed_content: object;
    base_version_id: string;
    document_id: string;
  };

  // Fetch document title
  const { data: doc } = await db
    .from("documents")
    .select("title")
    .eq("id", s.document_id)
    .single();

  // Fetch base version content
  const { data: baseVersion } = await db
    .from("versions")
    .select("content, version_number")
    .eq("id", s.base_version_id)
    .single();

  // Fetch reviews summary (decisions only, no PII beyond decision)
  const { data: reviews } = await db
    .from("reviews")
    .select("decision, created_at")
    .eq("suggestion_id", s.id)
    .order("created_at", { ascending: true });

  return ok({
    suggestion: {
      id: s.id,
      title: s.title,
      description: s.description,
      status: s.status,
      created_at: s.created_at,
      proposed_content: s.proposed_content,
    },
    baseVersion: baseVersion ?? null,
    documentTitle: (doc as { title: string } | null)?.title ?? "Untitled",
    reviews: (reviews ?? []).map((r: { decision: string; created_at: string }) => ({
      decision: r.decision,
      created_at: r.created_at,
    })),
  });
}
