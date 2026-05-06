"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Check, Globe2, Palette, Sparkles, User2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ThemeToggle } from "@/components/ThemeToggle";

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

  useEffect(() => {
    fetch("/api/workspace")
      .then((r) => r.json())
      .then((ws: { name?: string }) => {
        setWorkspaceName(ws.name ?? "My Workspace");
        setOriginalName(ws.name ?? "My Workspace");
      })
      .catch(console.error);
  }, []);

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
