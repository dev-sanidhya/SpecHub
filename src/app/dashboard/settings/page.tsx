"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Check, Copy, Globe2, Loader2, Palette, Sparkles, Trash2, User2, UserPlus, Users, Webhook, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import Image from "next/image";

interface Member {
  user_id: string;
  role: string;
  joined_at: string;
  name: string;
  imageUrl: string | null;
  email: string | null;
}

interface PendingInvite {
  id: string;
  email: string;
  token: string;
  created_at: string;
  expires_at: string;
}

const AI_FEATURES = [
  {
    title: "Contradiction detection",
    description:
      "Automatically scans documents for conflicting statements while you edit. Runs with a 3-second debounce after each change.",
  },
  {
    title: "Merge changelog",
    description:
      "When a suggestion is merged, Claude generates a 2-4 sentence summary of what changed and stores it in the version history.",
  },
  {
    title: "Diff summary",
    description:
      "On the suggestion review page, Claude writes a plain-English summary of what changed between the base and proposed versions.",
  },
];

export default function SettingsPage() {
  const { user } = useUser();
  const [workspaceName, setWorkspaceName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [workspaceSaved, setWorkspaceSaved] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Members
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  // Invites
  const [inviteEmail, setInviteEmail] = useState("");
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [newInviteLink, setNewInviteLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [revokingToken, setRevokingToken] = useState<string | null>(null);

  // Slack
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [slackSaved, setSlackSaved] = useState(false);
  const [savingSlack, setSavingSlack] = useState(false);

  // Audit log
  const [exportingAudit, setExportingAudit] = useState(false);

  useEffect(() => {
    fetch("/api/workspace")
      .then((r) => r.json())
      .then((ws: { name?: string; id?: string; owner_id?: string; slack_webhook_url?: string }) => {
        setWorkspaceName(ws.name ?? "My Workspace");
        setOriginalName(ws.name ?? "My Workspace");
        setIsOwner(ws.owner_id === user?.id);
        setSlackWebhookUrl(ws.slack_webhook_url ?? "");
      })
      .catch(console.error);
  }, [user?.id]);

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch("/api/workspace/members").then((r) => r.json()),
        fetch("/api/workspace/invites").then((r) => r.json()),
      ]);
      setMembers(Array.isArray(membersRes) ? membersRes : []);
      setPendingInvites(Array.isArray(invitesRes) ? invitesRes : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const handleRemoveMember = useCallback(async (targetUserId: string) => {
    setRemovingMember(targetUserId);
    try {
      await fetch(`/api/workspace/members/${targetUserId}`, { method: "DELETE" });
      await loadMembers();
    } finally {
      setRemovingMember(null);
    }
  }, [loadMembers]);

  const handleSendInvite = useCallback(async () => {
    if (!inviteEmail.trim()) return;
    setSendingInvite(true);
    setNewInviteLink(null);
    try {
      const res = await fetch("/api/workspace/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json() as { token?: string };
      if (data.token) {
        const link = `${window.location.origin}/invite/${data.token}`;
        setNewInviteLink(link);
        setInviteEmail("");
        await loadMembers();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendingInvite(false);
    }
  }, [inviteEmail, loadMembers]);

  const handleRevokeInvite = useCallback(async (token: string) => {
    setRevokingToken(token);
    try {
      await fetch(`/api/workspace/invites/${token}`, { method: "DELETE" });
      if (newInviteLink?.includes(token)) setNewInviteLink(null);
      await loadMembers();
    } finally {
      setRevokingToken(null);
    }
  }, [newInviteLink, loadMembers]);

  const handleCopyLink = useCallback(() => {
    if (!newInviteLink) return;
    void navigator.clipboard.writeText(newInviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }, [newInviteLink]);

  const handleSaveWorkspace = useCallback(async () => {
    if (!workspaceName.trim() || workspaceName === originalName) return;
    setSavingWorkspace(true);
    try {
      await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName.trim() }),
      });
      setOriginalName(workspaceName.trim());
      setWorkspaceSaved(true);
      setTimeout(() => setWorkspaceSaved(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setSavingWorkspace(false);
    }
  }, [workspaceName, originalName]);

  const handleSaveSlack = useCallback(async () => {
    setSavingSlack(true);
    try {
      await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slack_webhook_url: slackWebhookUrl }),
      });
      setSlackSaved(true);
      setTimeout(() => setSlackSaved(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setSavingSlack(false);
    }
  }, [slackWebhookUrl]);

  const accountFields = [
    { label: "Name", value: user?.fullName ?? user?.username ?? "Not set" },
    { label: "Email", value: user?.primaryEmailAddress?.emailAddress ?? "Not set" },
    { label: "User ID", value: user?.id ? `@${user.id.slice(0, 14)}...` : "Loading..." },
  ];

  return (
    <div className="space-y-6 px-1 pb-6">
      {/* Workspace */}
      <section className="panel overflow-hidden rounded-[2.2rem]">
        <div className="border-b border-border px-7 py-8 lg:px-8">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
            <Globe2 className="h-3.5 w-3.5" />
            Workspace
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-foreground">Workspace settings</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-2">
            Configure your workspace name. Changes here are reflected across the sidebar and all document headers.
          </p>
        </div>

        <div className="px-7 py-8 lg:px-8">
          <div className="max-w-lg space-y-2">
            <label className="block text-sm font-medium text-foreground">Workspace name</label>
            <div className="flex gap-3">
              <Input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveWorkspace()}
                placeholder="My Workspace"
                className="flex-1"
              />
              <Button
                size="md"
                variant={workspaceSaved ? "secondary" : "primary"}
                onClick={handleSaveWorkspace}
                loading={savingWorkspace}
                disabled={!workspaceName.trim() || workspaceName === originalName}
                className="shrink-0 gap-2"
              >
                {workspaceSaved && <Check className="h-4 w-4" />}
                {workspaceSaved ? "Saved" : "Save"}
              </Button>
            </div>
            <p className="text-xs text-foreground-3">This name appears in the sidebar header and dashboard overview.</p>
          </div>
        </div>
      </section>

      {/* Team Members */}
      <section className="panel overflow-hidden rounded-[2.2rem]">
        <div className="border-b border-border px-7 py-8 lg:px-8">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
            <Users className="h-3.5 w-3.5" />
            Team
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-foreground">Members</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-2">
            Invite teammates by email to collaborate on specs. Invited members join as editors and can create and review suggestions.
          </p>
        </div>

        {/* Current members */}
        <div className="border-b border-border">
          {loadingMembers ? (
            <div className="flex items-center gap-3 px-7 py-6 lg:px-8">
              <Loader2 className="h-4 w-4 animate-spin text-foreground-3" />
              <span className="text-sm text-foreground-2">Loading members...</span>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {members.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between gap-4 px-7 py-5 lg:px-8">
                  <div className="flex items-center gap-3">
                    {member.imageUrl ? (
                      <Image
                        src={member.imageUrl}
                        alt={member.name}
                        width={36}
                        height={36}
                        className="rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold uppercase text-indigo-500">
                        {member.name.slice(0, 1)}
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {member.name}
                        {member.user_id === user?.id && (
                          <span className="ml-2 text-xs font-normal text-foreground-3">(you)</span>
                        )}
                      </p>
                      {member.email && (
                        <p className="text-xs text-foreground-3">{member.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={member.role === "owner" ? "outline" : "default"}>
                      {member.role}
                    </Badge>
                    {isOwner && member.user_id !== user?.id && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.user_id)}
                        disabled={removingMember === member.user_id}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-3 transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                        aria-label="Remove member"
                      >
                        {removingMember === member.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invite form - owner only */}
        {isOwner && (
          <div className="px-7 py-7 lg:px-8">
            <p className="mb-4 text-sm font-semibold text-foreground">Invite by email</p>
            <div className="flex max-w-lg gap-3">
              <Input
                type="email"
                placeholder="teammate@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
                className="flex-1"
              />
              <Button
                size="md"
                onClick={handleSendInvite}
                loading={sendingInvite}
                disabled={!inviteEmail.trim()}
                className="shrink-0 gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Generate link
              </Button>
            </div>

            {/* Generated link */}
            {newInviteLink && (
              <div className="mt-4 max-w-lg rounded-[1.3rem] border border-indigo-500/20 bg-indigo-500/5 p-4">
                <p className="mb-2 text-xs font-semibold text-indigo-500">Invite link generated - share this</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg bg-surface px-3 py-2 text-xs text-foreground">
                    {newInviteLink}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-indigo-500 transition-colors hover:bg-indigo-500/10"
                  >
                    {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-foreground-3">Valid for 7 days. Anyone with this link can join the workspace.</p>
              </div>
            )}

            {/* Pending invites */}
            {pendingInvites.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-sm font-semibold text-foreground">Pending invites</p>
                <div className="max-w-lg space-y-2">
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between gap-3 rounded-[1.3rem] border border-border bg-surface-2/60 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm text-foreground">{invite.email}</p>
                        <p className="text-xs text-foreground-3">
                          Expires {new Date(invite.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRevokeInvite(invite.token)}
                        disabled={revokingToken === invite.token}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-foreground-3 transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                      >
                        {revokingToken === invite.token ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!isOwner && (
          <div className="px-7 py-6 lg:px-8">
            <p className="text-sm text-foreground-3">Only the workspace owner can invite new members.</p>
          </div>
        )}
      </section>

      {/* Appearance */}
      <section className="panel overflow-hidden rounded-[2.2rem]">
        <div className="border-b border-border px-7 py-8 lg:px-8">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
            <Palette className="h-3.5 w-3.5" />
            Appearance
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-foreground">Theme</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-2">
            Choose between light and dark mode. The preference is saved to your browser and persists across sessions.
          </p>
        </div>

        <div className="px-7 py-7 lg:px-8">
          <div className="flex max-w-lg items-center justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-foreground">Interface theme</p>
              <p className="mt-1 text-sm text-foreground-3">Applies to all pages in SpecHub.</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section className="panel overflow-hidden rounded-[2.2rem]">
        <div className="border-b border-border px-7 py-8 lg:px-8">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
            <Sparkles className="h-3.5 w-3.5" />
            AI features
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-foreground">AI integrations</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-2">
            SpecHub uses Claude to enhance your review workflow. These features run automatically as part of the core system.
          </p>
        </div>

        <div className="divide-y divide-border">
          {AI_FEATURES.map((feature) => (
            <div key={feature.title} className="flex items-start justify-between gap-8 px-7 py-7 lg:px-8">
              <div className="max-w-xl">
                <p className="text-sm font-semibold text-foreground">{feature.title}</p>
                <p className="mt-2 text-sm leading-7 text-foreground-2">{feature.description}</p>
              </div>
              <Badge variant="success" className="mt-0.5 shrink-0">
                Active
              </Badge>
            </div>
          ))}
        </div>
      </section>

      {/* Slack Integration */}
      <section className="panel overflow-hidden rounded-[2.2rem]">
        <div className="border-b border-border px-7 py-8 lg:px-8">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
            <Zap className="h-3.5 w-3.5" />
            Integrations
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-foreground">Slack notifications</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-2">
            Paste an incoming webhook URL to receive a Slack message when a suggestion is opened, merged, or rejected in this workspace.
          </p>
        </div>

        <div className="px-7 py-8 lg:px-8">
          <div className="max-w-lg space-y-4">
            <div className="rounded-[1.3rem] border border-border bg-surface-2/60 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Webhook className="h-4 w-4 text-indigo-500" />
                Incoming webhook URL
              </p>
              <p className="mt-2 text-xs leading-5 text-foreground-3">
                Create an app at api.slack.com, enable Incoming Webhooks, then paste the URL here.
                SpecHub never stores this key in client-side code.
              </p>
            </div>
            <Input
              type="url"
              placeholder="https://hooks.slack.com/services/T.../B.../..."
              value={slackWebhookUrl}
              onChange={(e) => setSlackWebhookUrl(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <Button
                size="md"
                variant={slackSaved ? "secondary" : "primary"}
                onClick={handleSaveSlack}
                loading={savingSlack}
                disabled={!isOwner}
                className="gap-2"
              >
                {slackSaved ? <Check className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                {slackSaved ? "Saved" : "Save webhook"}
              </Button>
              {slackWebhookUrl && (
                <button
                  type="button"
                  onClick={() => { setSlackWebhookUrl(""); void handleSaveSlack(); }}
                  className="text-xs text-foreground-3 hover:text-danger"
                >
                  Remove
                </button>
              )}
            </div>
            {!isOwner && (
              <p className="text-xs text-foreground-3">Only the workspace owner can configure integrations.</p>
            )}
          </div>
        </div>
      </section>

      {/* Audit Log */}
      {isOwner && (
        <section className="panel overflow-hidden rounded-[2.2rem]">
          <div className="border-b border-border px-7 py-8 lg:px-8">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
              <Globe2 className="h-3.5 w-3.5" />
              Audit log
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-foreground">Workspace activity export</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-2">
              Export a complete log of all workspace events - suggestions, reviews, merges, comments, and member joins. Available to workspace owners only.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 px-7 py-7 lg:px-8">
            <Button
              variant="secondary"
              size="md"
              loading={exportingAudit}
              className="gap-2"
              onClick={async () => {
                setExportingAudit(true);
                try {
                  const res = await fetch("/api/workspace/audit?format=csv");
                  if (!res.ok) return;
                  const blob = await res.blob();
                  const disposition = res.headers.get("Content-Disposition") ?? "";
                  const match = disposition.match(/filename="([^"]+)"/);
                  const filename = match ? match[1] : "audit.csv";
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = filename; a.click();
                  URL.revokeObjectURL(url);
                } finally { setExportingAudit(false); }
              }}
            >
              <Copy className="h-4 w-4" />
              Export as CSV
            </Button>
          </div>
        </section>
      )}

      {/* Account */}
      <section className="panel overflow-hidden rounded-[2.2rem]">
        <div className="border-b border-border px-7 py-8 lg:px-8">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
            <User2 className="h-3.5 w-3.5" />
            Account
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-foreground">Account details</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-2">
            Your account is managed by Clerk. To update your name, email, or password, visit your Clerk profile via the
            avatar in the sidebar.
          </p>
        </div>

        <div className="px-7 py-7 lg:px-8">
          <div className="max-w-lg space-y-3">
            {accountFields.map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 rounded-[1.3rem] border border-border bg-surface-2/60 px-5 py-4"
              >
                <p className="text-sm font-medium text-foreground-2">{label}</p>
                <p className="text-sm font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
