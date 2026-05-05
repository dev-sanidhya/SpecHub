import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { GitPullRequest, History, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";

const VALUE_POINTS = [
  {
    icon: GitPullRequest,
    title: "Reviewable edits",
    desc: "Every doc change gets a title, diff, discussion, and approval trail.",
  },
  {
    icon: History,
    title: "Version memory",
    desc: "Compare old snapshots instead of trying to reconstruct what changed from chat logs.",
  },
  {
    icon: ShieldCheck,
    title: "Safer sign-off",
    desc: "Keep requirements, approvals, and merges in one system instead of scattered tools.",
  },
];

export default async function SignInPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Return to the spec system that can keep up."
      description="Reviews, version history, and AI assistance should feel operational rather than bolted on after the document already drifted."
      strapline="Product documentation with shipping discipline"
      highlights={VALUE_POINTS.map((item) => ({
        icon: item.icon,
        title: item.title,
        description: item.desc,
      }))}
    >
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard"
        forceRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
        signUpForceRedirectUrl="/dashboard"
      />
    </AuthShell>
  );
}
