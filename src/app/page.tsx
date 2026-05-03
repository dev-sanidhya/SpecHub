import Link from "next/link";
import { ArrowRight, GitPullRequest, History, Sparkles, Shield, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";

const FEATURES = [
  {
    icon: GitPullRequest,
    title: "PR-style suggestions",
    desc: "Propose changes to any doc. Reviewers see a clean diff, discuss inline, and approve or reject - just like GitHub PRs but for product specs.",
  },
  {
    icon: History,
    title: "Full version history",
    desc: "Every version is a snapshot. Jump back to v1, compare v3 vs v7, or see what the PRD looked like before that big pivot.",
  },
  {
    icon: Sparkles,
    title: "AI-written changelogs",
    desc: "When a suggestion merges, Claude writes the changelog. Scope expanded to mobile. Auth simplified. Launch moved to Q3. In plain English.",
  },
  {
    icon: Shield,
    title: "Contradiction detection",
    desc: "Claude reads your whole doc and flags conflicts. Section 2 says mobile-first. Section 6 is desktop-only. Caught before it ships wrong.",
  },
  {
    icon: Users,
    title: "Approval workflows",
    desc: "Set who needs to sign off. PM + design + eng lead must all approve before a change merges. The audit trail is permanent.",
  },
  {
    icon: Zap,
    title: "Shareable diff links",
    desc: "Share a link to any diff view without login. Your stakeholder sees exactly what changed between v2 and v5. No account needed.",
  },
];

const DIFF_DEMO = [
  { type: "same", text: "## Authentication Flow" },
  { type: "same", text: "" },
  {
    type: "remove",
    text: "Users must complete a 6-step onboarding before accessing the dashboard.",
  },
  {
    type: "add",
    text: "Users access the dashboard immediately after signup. Onboarding is optional.",
  },
  { type: "same", text: "" },
  { type: "same", text: "### Requirements" },
  { type: "same", text: "- Google OAuth and GitHub OAuth supported" },
  { type: "remove", text: "- Email verification required before first login" },
  { type: "add", text: "- Email verification runs async, does not block access" },
  { type: "same", text: "- Session expires after 30 days of inactivity" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0c0c0e] text-[#f2f2f5]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-[#1a1a20] bg-[#0c0c0e]/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-indigo-500 flex items-center justify-center">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          <span className="font-semibold text-[#f2f2f5]">SpecHub</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Get started free</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-24 px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1.5 mb-6">
          <Sparkles className="w-3 h-3" />
          AI-powered version control for product docs
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
          GitHub for your{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            PRDs
          </span>
        </h1>

        <p className="text-lg text-[#a0a0b0] max-w-2xl mx-auto mb-10 leading-relaxed">
          Propose, review, and approve changes to product specs the same way your devs
          ship code. Full version history, PR-style diffs, approval workflows, and an AI
          that writes the changelog for you.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              Start building free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Sign in
            </Button>
          </Link>
        </div>

        <p className="text-xs text-[#606070] mt-4">
          Free for up to 3 docs. No credit card required.
        </p>
      </section>

      {/* Diff demo */}
      <section className="px-6 pb-24 max-w-3xl mx-auto">
        <div className="rounded-xl border border-[#2a2a32] bg-[#111114] overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a32] bg-[#0c0c0e]">
            <div className="flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-[#f2f2f5] font-medium">
                Simplify auth onboarding
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full font-medium">
                merged
              </span>
              <span className="text-xs text-[#606070]">v3 - v4</span>
            </div>
          </div>

          <div className="font-mono text-sm p-4 space-y-0.5">
            {DIFF_DEMO.map((line, i) => (
              <div
                key={i}
                className={`px-3 py-0.5 rounded text-sm leading-relaxed ${
                  line.type === "add"
                    ? "bg-green-500/10 text-green-400"
                    : line.type === "remove"
                    ? "bg-red-500/10 text-red-400 line-through"
                    : "text-[#a0a0b0]"
                }`}
              >
                <span className="select-none mr-2 opacity-50">
                  {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
                </span>
                {line.text || " "}
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-[#2a2a32] bg-indigo-500/5 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
            <p className="text-xs text-indigo-300 leading-relaxed">
              <span className="font-semibold">AI changelog - </span>
              Onboarding moved from blocking to optional. Email verification now async.
              Reduces signup friction by removing the 6-step gate before dashboard access.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3">Everything your team needs</h2>
          <p className="text-[#a0a0b0]">
            Built for PMs who want the same rigour in docs as their devs have in code.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="p-5 rounded-xl border border-[#2a2a32] bg-[#111114] hover:border-indigo-500/30 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                <Icon className="w-[18px] h-[18px] text-indigo-400" />
              </div>
              <h3 className="font-semibold text-[#f2f2f5] mb-1.5">{title}</h3>
              <p className="text-sm text-[#a0a0b0] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 max-w-2xl mx-auto text-center">
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-10">
          <h2 className="text-3xl font-bold mb-3">Start in 30 seconds</h2>
          <p className="text-[#a0a0b0] mb-8">
            Free for small teams. No credit card. Sign in with Google or GitHub.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="gap-2">
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1a1a20] px-6 py-6 text-center">
        <p className="text-xs text-[#606070]">
          Built by{" "}
          <a
            href="https://x.com/iisanidhya"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300"
          >
            @iisanidhya
          </a>
        </p>
      </footer>
    </div>
  );
}
