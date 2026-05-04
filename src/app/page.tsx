import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  GitPullRequest,
  History,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";

const FEATURES = [
  {
    icon: GitPullRequest,
    title: "Review specs like pull requests",
    desc: "Every proposed change has a title, discussion, approvals, and a merge history your team can actually trust.",
  },
  {
    icon: History,
    title: "Understand version drift fast",
    desc: "Jump between versions, compare snapshots, and share exactly what changed without dumping a PDF in Slack.",
  },
  {
    icon: Sparkles,
    title: "AI that writes useful summaries",
    desc: "Merged changes get plain-English changelogs and contradiction checks instead of another admin task for PMs.",
  },
  {
    icon: Shield,
    title: "Catch conflicts before delivery",
    desc: "Flag inconsistent requirements while editing, before product, design, and engineering each implement a different truth.",
  },
  {
    icon: Users,
    title: "Make approvals explicit",
    desc: "Keep sign-off visible so stakeholder feedback is part of the document lifecycle, not trapped in private threads.",
  },
  {
    icon: Zap,
    title: "Share decisions with context",
    desc: "Send a diff link, not a meeting invite. Everyone sees the reasoning, the edit, and the merged result in one place.",
  },
];

const STATS = [
  { value: "v1 to v27", label: "Document history that stays readable" },
  { value: "< 30s", label: "To open a doc and submit a suggestion" },
  { value: "1 source", label: "Of truth for product, design, and engineering" },
];

const DIFF = [
  { kind: "same", text: "## Authentication flow" },
  { kind: "same", text: "" },
  { kind: "remove", text: "Users must complete onboarding before accessing the dashboard." },
  { kind: "add", text: "Users land in the dashboard immediately after signup. Onboarding is contextual." },
  { kind: "same", text: "" },
  { kind: "same", text: "### Requirements" },
  { kind: "same", text: "- Support GitHub OAuth and Google OAuth" },
  { kind: "remove", text: "- Block first login until email verification finishes" },
  { kind: "add", text: "- Run email verification asynchronously without blocking first use" },
  { kind: "same", text: "- Session expires after 30 days of inactivity" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500 shadow-[0_16px_40px_-18px_rgba(99,102,241,0.65)]">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight">SpecHub</p>
              <p className="text-xs text-foreground-3">Product specs with version control discipline</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Start free</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-14 px-6 pb-24 pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pt-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-500">
              <Sparkles className="h-3.5 w-3.5" />
              Review product docs with the same rigor as code
            </div>

            <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-foreground sm:text-6xl">
              Stop shipping specs through document sprawl.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-foreground-2">
              SpecHub turns product requirements into a reviewable workflow: version history, suggestion diffs,
              approvals, and AI summaries that help teams move faster without losing the decision trail.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/sign-up">
                <Button size="lg" className="min-w-44 gap-2">
                  Create workspace <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="secondary" size="lg" className="min-w-44">
                  Open dashboard
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 text-sm text-foreground-2">
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                No credit card
              </div>
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                OAuth ready
              </div>
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Works for PM, design, and eng
              </div>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {STATS.map((stat) => (
                <div key={stat.label} className="panel rounded-2xl p-5">
                  <p className="text-2xl font-semibold tracking-tight text-foreground">{stat.value}</p>
                  <p className="mt-2 text-sm leading-6 text-foreground-2">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="grid-overlay panel overflow-hidden rounded-[2rem] border border-border/80 p-4">
              <div className="rounded-[1.5rem] border border-border bg-surface">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Spec change review</p>
                    <p className="text-xs text-foreground-3">Simplify auth onboarding</p>
                  </div>
                  <span className="rounded-full bg-green-500/12 px-3 py-1 text-xs font-semibold text-green-600 dark:text-green-400">
                    merged
                  </span>
                </div>

                <div className="space-y-3 p-5">
                  <div className="rounded-2xl bg-surface-2 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-3">Diff preview</span>
                      <span className="text-xs text-foreground-3">v3 → v4</span>
                    </div>
                    <div className="space-y-1 font-mono text-[13px] leading-6">
                      {DIFF.map((line, index) => (
                        <div
                          key={`${line.kind}-${index}`}
                          className={
                            line.kind === "add"
                              ? "rounded-lg bg-green-500/10 px-3 py-1 text-green-600 dark:text-green-400"
                              : line.kind === "remove"
                                ? "rounded-lg bg-red-500/10 px-3 py-1 text-red-600 line-through dark:text-red-400"
                                : "px-3 py-1 text-foreground-2"
                          }
                        >
                          <span className="mr-2 opacity-50">
                            {line.kind === "add" ? "+" : line.kind === "remove" ? "-" : " "}
                          </span>
                          {line.text || " "}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-indigo-500/8 p-4">
                    <div className="mb-2 flex items-center gap-2 text-indigo-500">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-[0.14em]">AI summary</span>
                    </div>
                    <p className="text-sm leading-6 text-foreground-2">
                      Onboarding moved from blocking to contextual. First-use friction drops while email verification and
                      access policies remain intact.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-500">Why teams use it</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              A better operating model for product documentation.
            </h2>
            <p className="mt-4 text-base leading-7 text-foreground-2">
              The weak point in most product stacks is not writing. It is coordination, review, and change visibility.
              SpecHub is designed around that problem.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="panel rounded-3xl p-6">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/12 text-indigo-500">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-foreground-2">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-28">
          <div className="panel rounded-[2rem] px-8 py-10 sm:px-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-500">Ready to replace the doc mess?</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                  Build a product memory your team can actually operate from.
                </h2>
                <p className="mt-4 text-base leading-7 text-foreground-2">
                  Start with one document, one workflow, and one place where product decisions stop getting lost.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/sign-up">
                  <Button size="lg" className="min-w-44 gap-2">
                    Start free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button size="lg" variant="secondary" className="min-w-44">
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
