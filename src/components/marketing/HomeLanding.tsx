"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  FileStack,
  GitPullRequest,
  History,
  Orbit,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const featureCards = [
  {
    icon: GitPullRequest,
    title: "Pull-request logic for specs",
    body: "Changes become reviewable proposals with titles, reasons, comments, approvals, and merge outcomes.",
  },
  {
    icon: History,
    title: "Version memory",
    body: "Every saved state becomes a snapshot so teams can compare intent across time instead of guessing from chat history.",
  },
  {
    icon: Bot,
    title: "AI support without fake magic",
    body: "Summaries and contradiction checks reduce review overhead while keeping the actual document change visible.",
  },
];

const pillars = [
  {
    icon: FileStack,
    label: "Product docs, not generic notes",
    text: "The system is built around PRDs, evolving decisions, and reviewable requirement changes.",
  },
  {
    icon: Workflow,
    label: "Operational workflow",
    text: "Write, suggest, review, and merge with the same discipline engineering teams already expect elsewhere.",
  },
  {
    icon: ShieldCheck,
    label: "Private by default",
    text: "Anyone can understand the product on the homepage. Actual workspace usage stays behind account auth.",
  },
];

const workflow = [
  "Create a source document in a real editor.",
  "Propose modifications as suggestions instead of rewriting silently.",
  "Review diffs, comments, and approvals before merging into the current version.",
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.65, ease: "easeOut" as const },
};

export function HomeLanding({ signedIn }: { signedIn: boolean }) {
  const primaryHref = signedIn ? "/dashboard" : "/sign-in";
  const primaryLabel = signedIn ? "Open dashboard" : "Get Started";
  const secondaryHref = signedIn ? "/dashboard" : "/sign-in";
  const secondaryLabel = signedIn ? "Go to workspace" : "Sign in";

  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      <div className="absolute inset-0">
        <motion.div
          className="absolute left-[-12%] top-[-8%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(110,118,255,0.34),transparent_62%)] blur-3xl"
          animate={{ x: [0, 40, -10, 0], y: [0, 20, 50, 0], scale: [1, 1.08, 0.98, 1] }}
          transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[-10%] top-[8%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(59,211,255,0.24),transparent_62%)] blur-3xl"
          animate={{ x: [0, -50, 15, 0], y: [0, 35, -10, 0], scale: [1, 0.92, 1.04, 1] }}
          transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-10rem] left-[24%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(150,108,255,0.16),transparent_64%)] blur-3xl"
          animate={{ x: [0, 25, -35, 0], y: [0, -22, 18, 0], scale: [1, 1.06, 0.95, 1] }}
          transition={{ duration: 22, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <div className="grid-overlay absolute inset-0 opacity-35 [mask-image:linear-gradient(180deg,white,transparent_90%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-6 lg:px-8 lg:py-8">
        <motion.header
          className="flex items-center justify-between gap-4"
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-accent shadow-[0_24px_54px_-24px_var(--accent)]">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">SpecHub</p>
              <p className="text-sm text-foreground-3">Version control for product docs</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={secondaryHref}
              className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-surface/75 px-5 text-sm font-medium text-foreground shadow-[0_18px_32px_-26px_var(--shadow-color)] backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-surface-2"
            >
              {secondaryLabel}
            </Link>
            <ThemeToggle />
          </div>
        </motion.header>

        <main className="pb-18 pt-10 lg:pb-24 lg:pt-18">
          <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <motion.div {...fadeUp}>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground-3 backdrop-blur">
                <Orbit className="h-3.5 w-3.5 text-accent" />
                GitHub for PRDs
              </div>

              <h1 className="mt-7 max-w-4xl text-5xl font-semibold tracking-[-0.08em] text-foreground sm:text-6xl lg:text-8xl">
                Abstract the chaos.
                <br />
                Keep the intent.
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-foreground-2 sm:text-xl">
                SpecHub gives product documentation the review discipline software teams already trust. Write source specs,
                route edits through diffs and approvals, and keep version history plus AI assistance in one controlled flow.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={primaryHref}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-white shadow-[0_24px_50px_-24px_var(--accent)] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)]"
                >
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {!signedIn && (
                  <Link
                    href="/sign-up"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-surface/70 px-6 text-sm font-semibold text-foreground backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-surface-2"
                  >
                    Create account
                  </Link>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-foreground-2">
                {["Rich editor", "Version history", "Suggestion review", "Comments", "AI checks"].map((tag) => (
                  <span key={tag} className="rounded-full border border-border bg-surface/60 px-3 py-1.5 backdrop-blur">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}>
              <div className="panel relative overflow-hidden rounded-[2.5rem] p-5 sm:p-6">
                <div className="absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)]" />

                <div className="grid gap-4">
                  <div className="panel-soft rounded-[2rem] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground-3">Workflow</p>
                        <p className="mt-2 text-xl font-semibold tracking-tight">Docs with engineering-grade review</p>
                      </div>
                      <div className="rounded-full border border-border bg-surface-5 p-3">
                        <Sparkles className="h-4 w-4 text-accent" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
                    <div className="panel-soft rounded-[2rem] p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground-3">System state</p>
                      <div className="mt-5 space-y-4">
                        <div className="rounded-[1.5rem] border border-border bg-surface/70 p-4">
                          <p className="text-sm font-semibold text-foreground">Current version</p>
                          <p className="mt-1 text-xs leading-6 text-foreground-2">v12 stays canonical until a suggestion is reviewed and merged.</p>
                        </div>
                        <div className="rounded-[1.5rem] border border-border bg-surface/70 p-4">
                          <p className="text-sm font-semibold text-foreground">Review surface</p>
                          <p className="mt-1 text-xs leading-6 text-foreground-2">Diffs, comments, approvals, and AI summaries sit in one place.</p>
                        </div>
                      </div>
                    </div>

                    <div className="panel-soft rounded-[2rem] p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground-3">Core loop</p>
                      <div className="mt-4 space-y-3">
                        {workflow.map((step, index) => (
                          <motion.div
                            key={step}
                            className="flex items-start gap-3 rounded-[1.5rem] border border-border bg-surface/72 px-4 py-4"
                            initial={{ opacity: 0, x: 18 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.08, duration: 0.45 }}
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
                              {index + 1}
                            </div>
                            <p className="text-sm leading-6 text-foreground-2">{step}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          <motion.section className="mt-10 grid gap-4 md:grid-cols-3" {...fadeUp}>
            {pillars.map(({ icon: Icon, label, text }) => (
              <div key={label} className="panel rounded-[2rem] p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-accent-subtle text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-xl font-semibold tracking-tight">{label}</h2>
                <p className="mt-2 text-sm leading-7 text-foreground-2">{text}</p>
              </div>
            ))}
          </motion.section>

          <motion.section className="mt-10 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]" {...fadeUp}>
            <div className="panel rounded-[2.2rem] p-6 sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground-3">Already built</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em]">This is a product surface, not a teaser page.</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-foreground-2">
                The app already supports authenticated workspaces, document creation, version snapshots, suggestion review
                flows, comment threads, and AI-powered summaries plus contradiction checks.
              </p>

              <div className="mt-6 grid gap-4">
                {featureCards.map(({ icon: Icon, title, body }) => (
                  <div key={title} className="panel-soft flex items-start gap-4 rounded-[1.7rem] p-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.2rem] bg-accent-subtle text-accent">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-base font-semibold">{title}</p>
                      <p className="mt-2 text-sm leading-6 text-foreground-2">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel rounded-[2.2rem] p-6 sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground-3">Access model</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em]">Learn publicly. Work privately.</h2>
              <p className="mt-4 text-base leading-7 text-foreground-2">
                The homepage explains the product clearly before signup. The actual writing, reviewing, and workspace data stay
                behind account auth so product documents are not exposed just because someone visits the site.
              </p>

              <div className="mt-6 rounded-[1.8rem] border border-border bg-surface-5 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.3rem] bg-accent text-white">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">Protected usage</p>
                    <p className="mt-2 text-sm leading-6 text-foreground-2">
                      Visitors can browse the homepage and auth screens. Signed-in users can enter the dashboard, documents,
                      suggestion review routes, and protected APIs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={primaryHref}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-white shadow-[0_24px_50px_-24px_var(--accent)] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)]"
                >
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={secondaryHref}
                  className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-surface/72 px-6 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:bg-surface-2"
                >
                  {secondaryLabel}
                </Link>
              </div>
            </div>
          </motion.section>
        </main>
      </div>
    </div>
  );
}
