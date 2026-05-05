import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Bot, FileSearch, Workflow } from "lucide-react";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";

const BENEFITS = [
  {
    icon: Workflow,
    title: "Structured approval flow",
    desc: "Turn spec changes into a visible process instead of a buried set of comments and DMs.",
  },
  {
    icon: FileSearch,
    title: "Readable diffs for requirements",
    desc: "Make requirement edits inspectable with version-aware history instead of replacing whole docs every week.",
  },
  {
    icon: Bot,
    title: "AI help where it matters",
    desc: "Use summaries and contradiction checks to reduce review overhead without hiding the actual change.",
  },
];

export default async function SignUpPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      eyebrow="Create account"
      title="Turn product documentation into a controlled system."
      description="Write specs, propose changes, and merge decisions in one place so the team works from current intent instead of stale copies."
      strapline="A better workflow for evolving product docs"
      highlights={BENEFITS.map((item) => ({
        icon: item.icon,
        title: item.title,
        description: item.desc,
      }))}
    >
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
        forceRedirectUrl="/dashboard"
        signInFallbackRedirectUrl="/dashboard"
        signInForceRedirectUrl="/dashboard"
      />
    </AuthShell>
  );
}
