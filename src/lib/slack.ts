/**
 * Fire-and-forget Slack webhook notifier.
 * Fetches the workspace's slack_webhook_url and posts a message.
 * Never throws - failures are logged only.
 */

import { createServerClient } from "./supabase";

export type SlackEventType =
  | "suggestion_opened"
  | "suggestion_merged"
  | "suggestion_rejected";

interface SlackPayload {
  eventType: SlackEventType;
  suggestionTitle: string;
  docTitle: string;
  actorName: string;
  link: string;
}

const ICONS: Record<SlackEventType, string> = {
  suggestion_opened: ":memo:",
  suggestion_merged: ":white_check_mark:",
  suggestion_rejected: ":x:",
};

const VERBS: Record<SlackEventType, string> = {
  suggestion_opened: "opened a suggestion",
  suggestion_merged: "merged a suggestion",
  suggestion_rejected: "rejected a suggestion",
};

function buildMessage(p: SlackPayload): object {
  const icon = ICONS[p.eventType];
  const verb = VERBS[p.eventType];
  return {
    text: `${icon} *${p.actorName}* ${verb} in *${p.docTitle}*`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${icon} *${p.actorName}* ${verb} in *<${p.link}|${p.docTitle}>*`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Suggestion:* ${p.suggestionTitle}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View in SpecHub" },
            url: p.link,
          },
        ],
      },
    ],
  };
}

export async function notifySlack(
  workspaceId: string,
  payload: SlackPayload
): Promise<void> {
  try {
    const db = createServerClient();
    const { data: ws } = await db
      .from("workspaces")
      .select("slack_webhook_url")
      .eq("id", workspaceId)
      .single();

    const webhookUrl = (ws as { slack_webhook_url: string | null } | null)?.slack_webhook_url;
    if (!webhookUrl) return;

    const body = buildMessage(payload);
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) console.error("Slack webhook error:", res.status);
  } catch (e) {
    console.error("notifySlack failed:", e);
  }
}
