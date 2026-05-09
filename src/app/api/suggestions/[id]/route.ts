/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthAndClient, ok, err } from "@/lib/api";
import { generateChangelog } from "@/lib/claude";
import { createNotification } from "@/lib/notifications";
import { notifySlack } from "@/lib/slack";
import { tiptapToText } from "@/lib/tiptapToText";

// GET /api/suggestions/:id - full suggestion with base version content + AI diff summary
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, db } = await getAuthAndClient();
  if (error) return error;

  const { id } = await params;

  const { data: suggestion, error: sErr } = await db!
    .from("suggestions")
    .select("*")
    .eq("id", id)
    .single();

  if (sErr) return err(sErr.message, 404);

  const s = suggestion as any;

  // Fetch base version content for diff
  const { data: baseVersion } = await db!
    .from("versions")
    .select("content, version_number")
    .eq("id", s.base_version_id)
    .single();

  return ok({ ...s, baseVersion });
}

// PATCH /api/suggestions/:id - update status (approve/reject/merge)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  const { id } = await params;
  const { status } = await req.json();

  if (!["open", "approved", "rejected", "merged"].includes(status)) {
    return err("Invalid status");
  }

  if (status === "merged") {
    // Fetch the suggestion
    const { data: suggestion } = await db!
      .from("suggestions")
      .select("document_id, proposed_content, title, description, base_version_id")
      .eq("id", id)
      .single();

    const s = suggestion as any;

    if (s) {
      // Get current version number
      const { data: doc } = await db!
        .from("documents")
        .select("current_version_number")
        .eq("id", s.document_id)
        .single();

      const nextNumber = ((doc as any)?.current_version_number ?? 0) + 1;

      // Fetch base version content for changelog generation
      const { data: baseVersion } = await db!
        .from("versions")
        .select("content")
        .eq("id", s.base_version_id)
        .single();

      // Generate AI changelog (non-blocking - we still merge even if it fails)
      let aiSummary: string | null = null;
      try {
        aiSummary = await generateChangelog(
          (baseVersion as any)?.content ?? {},
          s.proposed_content,
          s.title,
          s.description
        );
      } catch (e) {
        console.error("AI changelog failed:", e);
      }

      // Create the new canonical version
      const { data: newVersion } = await db!
        .from("versions")
        .insert({
          document_id: s.document_id,
          content: s.proposed_content,
          version_number: nextNumber,
          ai_summary: aiSummary,
          created_by: userId!,
        })
        .select()
        .single();

      if (newVersion) {
        await db!
          .from("documents")
          .update({
            current_version_id: (newVersion as any).id,
            current_version_number: nextNumber,
            content_text: tiptapToText(s.proposed_content),
          })
          .eq("id", s.document_id);
      }
    }
  }

  const { data, error: dbErr } = await db!
    .from("suggestions")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (dbErr) return err(dbErr.message, 500);

  // Notify suggestion author on merge or reject
  if (status === "merged" || status === "rejected") {
    try {
      const updated = data as any;
      if (updated && updated.created_by !== userId!) {
        const { data: doc } = await db!
          .from("documents")
          .select("workspace_id")
          .eq("id", updated.document_id)
          .single();
        const wsId = (doc as any)?.workspace_id;
        if (wsId) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
          const link = `${appUrl}/dashboard/docs/${updated.document_id}/suggestions/${id}`;

          if (updated.created_by !== userId!) {
            void createNotification(
              updated.created_by,
              wsId,
              status === "merged" ? "suggestion_merged" : "suggestion_rejected",
              {
                suggestion_id: id,
                suggestion_title: updated.title,
                doc_id: updated.document_id,
                actor_id: userId!,
              }
            );
          }

          // Fetch doc title for Slack
          const { data: docForSlack } = await db!
            .from("documents")
            .select("title")
            .eq("id", updated.document_id)
            .single();

          void notifySlack(wsId, {
            eventType: status === "merged" ? "suggestion_merged" : "suggestion_rejected",
            suggestionTitle: updated.title,
            docTitle: (docForSlack as any)?.title ?? "a document",
            actorName: userId!,
            link,
          });
        }
      }
    } catch {
      // non-critical
    }
  }

  return ok(data);
}
