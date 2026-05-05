import { auth } from "@clerk/nextjs/server";
import {
  ArrowRight,
  Bot,
  FileStack,
  GitPullRequest,
  History,
  MessageSquareQuote,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const PRIMARY_FLOW = [
  {
    title: "Write the source document",
    description: "Create a product spec in a real editor instead of a fragile page that gets overwritten every week.",
  },
  {
    title: "Propose changes as suggestions",
    description: "Route edits through titled suggestions with reasons, diffs, and discussion instead of direct silent rewrites.",
  },
  {
    title: "Review, approve, and merge",
    description: "Keep a visible record of what changed, why it changed, and who accepted it.",
  },
];

const FEATURE_CARDS = [
  {
    icon: GitPullRequest,
    title: "PR-style suggestions",
    description: "Every change can be proposed, discussed, approved, or rejected with a proper trail.",
  },
  {
    icon: History,
    title: "Version history",
    description: "Each save becomes a recoverable snapshot so teams can compare decisions over time.",
  },
  {
    icon: Bot,
    title: "AI review help",
    description: "Generate change summaries and contradiction checks without hiding the underlying diff.",
  },
  {
    icon: MessageSquareQuote,
    title: "Review context",
    description: "Keep comments and review outcomes tied to the exact suggested change being debated.",
  },
];

const VALUE_POINTS = [
  {
    icon: FileStack,
    title: "Built for PRDs and specs",
    description: "SpecHub is for evolving product documents, not generic note-taking.",
  },
  {
    icon: Workflow,
    title: "Process without friction",
    description: "The workflow feels familiar if your team already ships software through review.",
  },
  {
    icon: ShieldCheck,
    title: "Account required for usage",
    description: "The product stays private by default. Visitors can learn what it does, but only signed-in users can use it.",
  },
];

function ctaClass(kind: "primary" | "secondary") {
  return kind === "primary"
    ? "inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_-18px_rgba(99,102,241,0.55)] transition-all hover:-translate-y-0.5 hover:bg-indigo-600"
    : "inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface/85 px-5 py-3 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:bg-surface-2";
}

export default async function HomePage() {
  const { userId } = await auth();
  const signedIn = Boolean(userId);
  const primaryHref = signedIn ? "/dashboard" : "/sign-in";
  const primaryLabel = signedIn ? "Open dashboard" : "Get Started";
  const secondaryHref = signedIn ? "/dashboard" : "/sign-in";
  const secondaryLabel = signedIn ? "Go to workspace" : "Sign in";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.2),transparent_24%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.13),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(79,70,229,0.12),transparent_20%)]" />
      <div className="absolute inset-x-0 top-0 h-[38rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-6 lg:px-8 lg:py-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 shadow-[0_18px_44px_-18px_rgba(99,102,241,0.6)]">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">SpecHub</p>
              <p className="text-sm text-foreground-3">Version control for product documentation</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {signedIn ? (
              <Link href="/dashboard" className={ctaClass("secondary")}>
                Dashboard
              </Link>
            ) : (
              <Link href="/sign-in" className={ctaClass("secondary")}>
                Sign in
              </Link>
            )}
            <ThemeToggle />
          </div>
        </header>

        <main className="pb-12 pt-10 lg:pb-20 lg:pt-16">
          <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
                <Sparkles className="h-3.5 w-3.5" />
                GitHub for PRDs
              </div>

              <h1 className="mt-6 text-5xl font-semibold tracking-[-0.05em] text-foreground sm:text-6xl lg:text-7xl">
                Product docs that can survive real change.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-foreground-2 sm:text-xl">
                SpecHub turns specs into a reviewable system. Write documents, propose changes like pull requests, compare
                versions, and use AI to summarize diffs and catch contradictions before they spread.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={primaryHref} className={ctaClass("primary")}>
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={secondaryHref} className={ctaClass("secondary")}>
                  {secondaryLabel}
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-foreground-2">
                <span className="rounded-full border border-border bg-surface/70 px-3 py-1.5">Rich editor</span>
                <span className="rounded-full border border-border bg-surface/70 px-3 py-1.5">Version snapshots</span>
                <span className="rounded-full border border-border bg-surface/70 px-3 py-1.5">Suggestion reviews</span>
                <span className="rounded-full border border-border bg-surface/70 px-3 py-1.5">AI summaries</span>
                <span className="rounded-full border border-border bg-surface/70 px-3 py-1.5">Clerk auth</span>
              </div>
            </div>

            <div className="panel rounded-[2rem] p-6 sm:p-7">
              <div className="grid-overlay rounded-[1.5rem] border border-border/70 bg-surface/80 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">How it works</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">A doc workflow with engineering discipline</h2>
                  </div>
                  <div className="rounded-2xl bg-indigo-500/12 p-3 text-indigo-500">
                    <Workflow className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {PRIMARY_FLOW.map((item, index) => (
                    <div key={item.title} className="rounded-[1.4rem] border border-border bg-surface px-4 py-4 shadow-[0_18px_34px_-28px_var(--shadow-color)]">
                      <div className="flex items-start gap-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-500 text-sm font-semibold text-white">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-base font-semibold text-foreground">{item.title}</p>
                          <p className="mt-1 text-sm leading-6 text-foreground-2">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-3">
            {VALUE_POINTS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="panel rounded-[1.8rem] p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/12 text-indigo-500">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-foreground-2">{description}</p>
              </div>
            ))}
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="panel rounded-[2rem] p-6 sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">What is already built</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">The product already supports the core loop.</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-foreground-2">
                This is not just a waitlist page. The app behind this homepage already has authenticated workspaces, document
                creation, saved versions, suggestion review flows, comments, reviews, and AI-generated summaries.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {FEATURE_CARDS.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="rounded-[1.5rem] border border-border bg-surface/85 p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/12 text-indigo-500">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-base font-semibold text-foreground">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-foreground-2">{description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel rounded-[2rem] p-6 sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">Why the gate exists</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Visitors can understand the product. Only members can use it.</h2>
              <p className="mt-4 text-base leading-7 text-foreground-2">
                The homepage explains the workflow, but the actual product remains account-gated. That keeps private specs,
                reviews, and workspace data behind authentication while still making the value clear before someone signs up.
              </p>

              <div className="mt-6 rounded-[1.6rem] border border-border bg-surface/80 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 text-white">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">Access model</p>
                    <p className="mt-2 text-sm leading-6 text-foreground-2">
                      Unauthenticated users can view this homepage and the auth screens. Authenticated users can access the
                      dashboard, documents, workspace routes, and protected APIs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href={primaryHref} className={ctaClass("primary")}>
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {!signedIn && (
                  <Link href="/sign-up" className={ctaClass("secondary")}>
                    Create account
                  </Link>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
