import { createServerClient } from "./supabase";

export type NotificationType =
  | "suggestion_opened"
  | "review_posted"
  | "suggestion_merged"
  | "suggestion_rejected"
  | "comment_posted";

export interface NotificationPayload {
  suggestion_id?: string;
  suggestion_title?: string;
  doc_id?: string;
  doc_title?: string;
  actor_id?: string;
  decision?: string;
}

/**
 * Fire-and-forget notification creation.
 * Never throws - failures are logged only.
 */
export async function createNotification(
  userId: string,
  workspaceId: string,
  type: NotificationType,
  payload: NotificationPayload
): Promise<void> {
  try {
    const db = createServerClient();
    await db.from("notifications").insert({
      user_id: userId,
      workspace_id: workspaceId,
      type,
      payload,
    });
  } catch (e) {
    console.error("createNotification failed:", e);
  }
}
