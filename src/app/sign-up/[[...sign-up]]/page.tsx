"use client";

import { useSignUp } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function SignUpPage() {
  const { signUp, isLoaded, setActive } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true); setError("");
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[] };
      setError(clerkErr.errors?.[0]?.message ?? "Sign up failed. Please try again.");
    } finally { setLoading(false); }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true); setError("");
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[] };
      setError(clerkErr.errors?.[0]?.message ?? "Invalid code. Please try again.");
    } finally { setLoading(false); }
  };

  const handleSocial = async (provider: "oauth_github" | "oauth_google") => {
    if (!isLoaded) return;
    setSocialLoading(provider);
    try {
      await signUp.authenticateWithRedirect({
        strategy: provider, redirectUrl: "/sso-callback", redirectUrlComplete: "/dashboard",
      });
    } catch { setSocialLoading(null); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="w-full max-w-sm px-4">
        <div className="mb-8 text-center">
          <a href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-foreground font-semibold text-lg">SpecHub</span>
          </a>
        </div>

        <div className="bg-surface border border-border rounded-xl p-8 shadow-xl">
          {step === "form" ? (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-xl font-semibold text-foreground">Create your account</h1>
                <p className="text-sm text-foreground-2 mt-1">Welcome! Please fill in the details to get started</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button onClick={() => handleSocial("oauth_github")} disabled={!!socialLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border-2 bg-surface-2 text-foreground text-sm font-medium hover:bg-surface-3 transition-colors disabled:opacity-50"
                >
                  {socialLoading === "oauth_github" ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                  )}
                  GitHub
                </button>
                <button onClick={() => handleSocial("oauth_google")} disabled={!!socialLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border-2 bg-surface-2 text-foreground text-sm font-medium hover:bg-surface-3 transition-colors disabled:opacity-50"
                >
                  {socialLoading === "oauth_google" ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Google
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-border-2" />
                <span className="text-xs text-foreground-3">or</span>
                <div className="flex-1 h-px bg-border-2" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-foreground-2 mb-1.5">Email address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address" required
                    className="w-full bg-surface-2 border border-border-2 rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder-foreground-3 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-foreground-2 mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password" required
                      className="w-full bg-surface-2 border border-border-2 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder-foreground-3 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-3 hover:text-foreground-2 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-medium text-sm rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Creating account..." : "Continue"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-xl font-semibold text-foreground">Check your email</h1>
                <p className="text-sm text-foreground-2 mt-1">
                  We sent a verification code to <span className="text-foreground">{email}</span>
                </p>
              </div>
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-sm text-foreground-2 mb-1.5">Verification code</label>
                  <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter 6-digit code" required maxLength={6}
                    className="w-full bg-surface-2 border border-border-2 rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder-foreground-3 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors text-center tracking-widest"
                  />
                </div>
                {error && <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-medium text-sm rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Verifying..." : "Verify email"}
                </button>
                <button type="button" onClick={() => { setStep("form"); setError(""); }}
                  className="w-full text-sm text-foreground-3 hover:text-foreground-2 transition-colors py-1"
                >Back</button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-foreground-3 mt-6">
          Already have an account?{" "}
          <a href="/sign-in" className="text-indigo-500 hover:text-indigo-400 transition-colors">Sign in</a>
        </p>
      </div>
    </div>
  );
}
