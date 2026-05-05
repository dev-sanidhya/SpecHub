import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Bot, FileSearch, Workflow } from "lucide-react";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

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
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.12),transparent_24%)]" />

      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1fr_500px] lg:items-center">
        <section className="hidden lg:block">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 shadow-[0_18px_44px_-18px_rgba(99,102,241,0.6)]">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <div>
              <p className="text-xl font-semibold tracking-tight text-foreground">SpecHub</p>
              <p className="text-sm text-foreground-3">A better workflow for evolving product docs</p>
            </div>
          </Link>

          <div className="mt-12 max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-500">Create account</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.04em] text-foreground">
              Start treating product documentation like a real system.
            </h1>
            <p className="mt-6 text-lg leading-8 text-foreground-2">
              Write specs, propose changes, and merge decisions in one place so the team works from current intent instead of stale copies.
            </p>
          </div>

          <div className="mt-10 grid gap-4">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="panel rounded-3xl p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/12 text-indigo-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-foreground-2">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[500px]">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500">
                <span className="text-sm font-bold text-white">S</span>
              </div>
              <span className="text-lg font-semibold text-foreground">SpecHub</span>
            </Link>
          </div>

          <div className="panel rounded-[2rem] p-3">
            <SignUp
              path="/sign-up"
              routing="path"
              signInUrl="/sign-in"
              fallbackRedirectUrl="/dashboard"
              forceRedirectUrl="/dashboard"
              signInFallbackRedirectUrl="/dashboard"
              signInForceRedirectUrl="/dashboard"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
