"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import { CheckCircle, Loader2, Users, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface InviteInfo {
  token: string;
  email: string;
  workspaceId: string;
  workspaceName: string;
  inviterName: string;
  expiresAt: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { user, isLoaded } = useUser();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setInviteError(data.error);
        else setInvite(data as InviteInfo);
      })
      .catch(() => setInviteError("Failed to load invite"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    if (!user) return;
    setAccepting(true);
    try {
      const res = await fetch(`/api/invite/${token}/accept`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json();
        setInviteError(d.error ?? "Failed to accept invite");
        return;
      }
      setAccepted(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch {
      setInviteError("Failed to accept invite");
    } finally {
      setAccepting(false);
    }
  };

  if (loading || !isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-foreground-3" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1.3rem] bg-indigo-500 shadow-[0_20px_40px_-20px_rgba(99,102,241,0.65)]">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground">SpecHub</span>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-surface p-8 shadow-[0_32px_64px_-32px_var(--shadow-color)]">
          {inviteError ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-red-500/10">
                <XCircle className="h-7 w-7 text-red-500" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">Invite unavailable</h1>
              <p className="mt-3 text-sm leading-7 text-foreground-2">{inviteError}</p>
              <Link href="/dashboard">
                <Button size="md" variant="secondary" className="mt-6">
                  Go to dashboard
                </Button>
              </Link>
            </div>
          ) : accepted ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-green-500/10">
                <CheckCircle className="h-7 w-7 text-green-500" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">You&apos;re in!</h1>
              <p className="mt-3 text-sm leading-7 text-foreground-2">
                Welcome to <span className="font-semibold text-foreground">{invite?.workspaceName}</span>. Redirecting
                you to the workspace...
              </p>
            </div>
          ) : invite ? (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-indigo-500/10">
                <Users className="h-7 w-7 text-indigo-500" />
              </div>
              <h1 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-foreground">
                You&apos;ve been invited
              </h1>
              <p className="mt-3 text-sm leading-7 text-foreground-2">
                <span className="font-semibold text-foreground">{invite.inviterName}</span> invited you to join the{" "}
                <span className="font-semibold text-foreground">{invite.workspaceName}</span> workspace on SpecHub.
              </p>
              <p className="mt-2 text-xs text-foreground-3">
                Invite sent to {invite.email} &middot; expires{" "}
                {new Date(invite.expiresAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>

              <div className="mt-7">
                {user ? (
                  <Button
                    size="lg"
                    className="w-full gap-2"
                    onClick={handleAccept}
                    loading={accepting}
                  >
                    <Users className="h-4 w-4" />
                    Join {invite.workspaceName}
                  </Button>
                ) : (
                  <SignInButton
                    mode="redirect"
                    forceRedirectUrl={`/invite/${token}`}
                  >
                    <Button size="lg" className="w-full gap-2">
                      Sign in to accept invite
                    </Button>
                  </SignInButton>
                )}
              </div>

              {user && (
                <p className="mt-4 text-center text-xs text-foreground-3">
                  Signed in as{" "}
                  <span className="font-medium text-foreground-2">
                    {user.primaryEmailAddress?.emailAddress}
                  </span>
                </p>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
