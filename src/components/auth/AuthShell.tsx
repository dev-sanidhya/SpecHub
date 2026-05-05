import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  strapline: string;
  highlights: Array<{ icon: LucideIcon; title: string; description: string }>;
  children: React.ReactNode;
}

export function AuthShell({ eyebrow, title, description, strapline, highlights, children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0">
        <div className="absolute left-[-10%] top-[-8%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(122,125,255,0.26),transparent_62%)] blur-3xl" />
        <div className="absolute right-[-8%] top-[12%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(62,211,255,0.2),transparent_62%)] blur-3xl" />
        <div className="absolute bottom-[-8rem] left-[20%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(157,106,255,0.18),transparent_64%)] blur-3xl" />
        <div className="grid-overlay absolute inset-0 opacity-35 [mask-image:linear-gradient(180deg,white,transparent_92%)]" />
      </div>

      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
        <section className="hidden lg:block">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.3rem] bg-indigo-500 shadow-[0_22px_46px_-22px_rgba(99,102,241,0.6)]">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <div>
              <p className="text-xl font-semibold tracking-tight text-foreground">SpecHub</p>
              <p className="text-sm text-foreground-3">{strapline}</p>
            </div>
          </Link>

          <div className="mt-14 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-500">{eyebrow}</p>
            <h1 className="mt-4 text-6xl font-semibold tracking-[-0.08em] text-foreground">{title}</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-foreground-2">{description}</p>
          </div>

          <div className="mt-10 grid gap-4">
            {highlights.map(({ icon: Icon, title: itemTitle, description: itemDescription }) => (
              <div key={itemTitle} className="panel rounded-[1.8rem] p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1.2rem] bg-indigo-500/12 text-indigo-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">{itemTitle}</p>
                    <p className="mt-2 text-sm leading-7 text-foreground-2">{itemDescription}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[470px]">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[1.15rem] bg-indigo-500">
                <span className="text-sm font-bold text-white">S</span>
              </div>
              <span className="text-lg font-semibold text-foreground">SpecHub</span>
            </Link>
          </div>

          <div className="panel rounded-[2rem] p-3 sm:p-4">{children}</div>
        </section>
      </div>
    </div>
  );
}
