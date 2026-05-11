import { getAuthAndClient, ok, err } from "@/lib/api";
import { createNotification } from "@/lib/notifications";
import { notifySlack } from "@/lib/slack";

// GET /api/documents/:id/suggestions
// Returns all non-draft suggestions, plus drafts owned by the current user
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  const { id } = await params;

  const { data, error: dbErr } = await db!
    .from("suggestions")
    .select("id, title, description, status, created_by, created_at")
    .eq("document_id", id)
    .order("created_at", { ascending: false });

  if (dbErr) return err(dbErr.message, 500);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = (data ?? []).filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: any) => s.status !== "draft" || s.created_by === userId
  );

  // Attach comment counts
  const suggestionIds = rows.map((s) => s.id as string);
  const commentCounts: Record<string, number> = {};

  if (suggestionIds.length > 0) {
    const { data: comments } = await db!
      .from("comments")
      .select("suggestion_id")
      .in("suggestion_id", suggestionIds);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (comments ?? []).forEach((c: any) => {
      commentCounts[c.suggestion_id] = (commentCounts[c.suggestion_id] ?? 0) + 1;
    });
  }

  return ok(rows.map((s) => ({ ...s, comments: commentCounts[s.id] ?? 0 })));
}

// POST /api/documents/:id/suggestions - create a suggestion (open or draft)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  const { id } = await params;
  const { title, description, proposed_content, base_version_id, draft, is_auto } = await req.json();

  if (!title || !proposed_content || !base_version_id) {
    return err("title, proposed_content, and base_version_id are required");
  }

  const isDraft = draft === true;

  const { data, error: dbErr } = await db!
    .from("suggestions")
    .insert({
      document_id: id,
      base_version_id,
      proposed_content,
      title,
      description: description ?? null,
      created_by: userId!,
      status: isDraft ? "draft" : "open",
      is_auto: is_auto === true,
    })
    .select()
    .single();

  if (dbErr) return err(dbErr.message, 500);

  // Only notify + fire Slack for public (non-draft) suggestions
  if (!isDraft) {
    try {
      const { data: doc } = await db!
        .from("documents")
        .select("created_by, title, workspace_id")
        .eq("id", id)
        .single();
      const d = doc as { created_by: string; title: string; workspace_id: string } | null;
      if (d) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
        const link = `${appUrl}/dashboard/docs/${id}/suggestions/${(data as { id: string }).id}`;
        if (d.created_by !== userId!) {
          void createNotification(d.created_by, d.workspace_id, "suggestion_opened", {
            suggestion_id: (data as { id: string }).id,
            suggestion_title: title as string,
            doc_id: id,
            doc_title: d.title,
            actor_id: userId!,
          });
        }
        void notifySlack(d.workspace_id, {
          eventType: "suggestion_opened",
          suggestionTitle: title as string,
          docTitle: d.title,
          actorName: userId!,
          link,
        });
      }
    } catch {
      // non-critical
    }
  }

  return ok(data, 201);
}
