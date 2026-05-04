"use client";

import { SignUp } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.12),transparent_28%)]" />
      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle className="h-10 w-10 rounded-full border border-border bg-surface/90 backdrop-blur hover:bg-surface-2" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="mb-10 text-center">
            <a href="/" className="inline-flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500 shadow-[0_14px_34px_rgba(99,102,241,0.35)]">
                <span className="text-sm font-bold text-white">S</span>
              </div>
              <span className="text-2xl font-semibold tracking-tight text-foreground">SpecHub</span>
            </a>
            <p className="mt-4 text-sm text-foreground-2">
              Create an account in the same visual system as the rest of the product.
            </p>
          </div>

          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/dashboard"
            signInFallbackRedirectUrl="/dashboard"
          />
        </div>
      </div>
    </div>
  );
}
