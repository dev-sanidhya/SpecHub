/**
 * POST /api/workspace/digest
 *
 * Sends a workspace activity digest email to all members.
 * Uses Resend if RESEND_API_KEY is configured, otherwise logs to console.
 *
 * Triggered manually from the Settings page. Can also be called by an
 * external cron (e.g. Vercel Cron or GitHub Actions) for automated weekly digests.
 */

import { getAuthAndClient, err, ok } from "@/lib/api";
import { clerkClient } from "@clerk/nextjs/server";

interface DigestRow {
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

function buildEmailHtml(workspaceName: string, events: DigestRow[]): string {
  const eventLines = events
    .slice(0, 20)
    .map((e) => {
      const p = e.payload;
      const date = new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
      switch (e.type) {
        case "suggestion_opened": return `<li>${date} - New suggestion: <strong>${String(p.suggestion_title ?? "")}</strong> on ${String(p.doc_title ?? "a document")}</li>`;
        case "suggestion_merged": return `<li>${date} - Merged: <strong>${String(p.suggestion_title ?? "")}</strong></li>`;
        case "suggestion_rejected": return `<li>${date} - Rejected: <strong>${String(p.suggestion_title ?? "")}</strong></li>`;
        case "comment_posted": return `<li>${date} - New comment on suggestion: <strong>${String(p.suggestion_title ?? "")}</strong></li>`;
        default: return `<li>${date} - ${e.type}</li>`;
      }
    })
    .join("\n");

  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
      <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">SpecHub Digest</h1>
      <p style="color: #555; margin-bottom: 24px;">Recent activity in <strong>${workspaceName}</strong></p>
      <ul style="padding-left: 20px; line-height: 1.9; color: #333;">
        ${eventLines || "<li>No activity in the past 7 days.</li>"}
      </ul>
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
      <p style="font-size: 12px; color: #999;">
        You received this because you are a member of the ${workspaceName} workspace on SpecHub.
      </p>
    </div>
  `;
}

export async function POST() {
  const { error, userId, db } = await getAuthAndClient();
  if (error) return error;

  // Owner only
  const { data: ws } = await db!
    .from("workspaces")
    .select("id, name")
    .eq("owner_id", userId!)
    .single();

  if (!ws) return err("Only workspace owners can send digests.", 403);

  const workspace = ws as { id: string; name: string };

  // Fetch last 7 days of events
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: events } = await db!
    .from("notifications")
    .select("type, payload, created_at")
    .eq("workspace_id", workspace.id)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (events ?? []) as DigestRow[];

  // Get all workspace member emails
  const { data: members } = await db!
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", workspace.id);

  const memberIds = (members ?? []).map((m: { user_id: string }) => m.user_id);

  const clerk = await clerkClient();
  const emails: string[] = [];

  for (const uid of memberIds) {
    try {
      const u = await clerk.users.getUser(uid);
      const email = u.emailAddresses[0]?.emailAddress;
      if (email) emails.push(email);
    } catch {
      // skip if user not found
    }
  }

  const html = buildEmailHtml(workspace.name, rows);
  const subject = `SpecHub weekly digest - ${workspace.name}`;

  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey) {
    // Send via Resend
    const results = await Promise.allSettled(
      emails.map((to) =>
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "SpecHub <digest@spechub.app>",
            to,
            subject,
            html,
          }),
        })
      )
    );
    const sent = results.filter((r) => r.status === "fulfilled").length;
    return ok({ sent, total: emails.length });
  }

  // Fallback: log to console (development / no Resend key configured)
  console.log(`[Digest] Would send to ${emails.length} members:`, emails);
  console.log(`[Digest] Subject: ${subject}`);
  return ok({ sent: 0, total: emails.length, note: "Set RESEND_API_KEY to enable email sending." });
}
