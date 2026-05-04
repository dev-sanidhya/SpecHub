"use client";

import { SignUp } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <a href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-foreground font-semibold text-lg">SpecHub</span>
          </a>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-xl">
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
