"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

function ThemedClerkProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#6366f1",
          colorDanger: isDark ? "#f87171" : "#dc2626",
          colorSuccess: isDark ? "#4ade80" : "#16a34a",
          colorWarning: isDark ? "#f59e0b" : "#d97706",
          colorBackground: isDark ? "#0e0e12" : "#ffffff",
          colorForeground: isDark ? "#f2f2f5" : "#0e0c1e",
          colorMutedForeground: isDark ? "#a0a0b0" : "#4c4968",
          colorMuted: isDark ? "#111114" : "#ebebf8",
          colorInput: isDark ? "#111114" : "#ebebf8",
          colorInputForeground: isDark ? "#f2f2f5" : "#0e0c1e",
          colorBorder: isDark ? "#2a2a32" : "#c2c0dc",
          colorNeutral: isDark ? "#2a2a32" : "#c2c0dc",
          colorRing: "#6366f1",
          colorShadow: isDark ? "rgba(0,0,0,0.45)" : "rgba(18,18,23,0.12)",
          fontFamily: "var(--font-geist-sans)",
          borderRadius: "1rem",
        },
        elements: {
          card: "border border-border bg-surface/95 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur",
          headerTitle: "text-foreground text-3xl font-semibold tracking-tight",
          headerSubtitle: "text-foreground-2",
          socialButtonsBlockButton:
            "border border-border bg-surface-2 text-foreground hover:bg-surface-3 shadow-none",
          socialButtonsBlockButtonText: "font-medium text-foreground",
          dividerLine: "bg-border",
          dividerText: "text-foreground-3",
          formFieldLabel: "text-foreground-2 font-medium",
          formFieldInput:
            "border border-border bg-surface-2 text-foreground placeholder:text-foreground-3 focus:border-indigo-500 focus:ring-0",
          formButtonPrimary:
            "bg-indigo-500 text-white hover:bg-indigo-600 shadow-[0_12px_30px_rgba(99,102,241,0.32)]",
          footerActionText: "text-foreground-2",
          footerActionLink: "text-indigo-500 hover:text-indigo-400",
          identityPreviewText: "text-foreground",
          formResendCodeLink: "text-indigo-500 hover:text-indigo-400",
          otpCodeFieldInput: "border border-border bg-surface-2 text-foreground focus:border-indigo-500",
          alertText: "text-foreground",
          alert: isDark ? "border-red-500/20 bg-red-500/10" : "border-red-200 bg-red-50",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      themes={["light", "dark"]}
      storageKey="spechub-theme"
      disableTransitionOnChange
    >
      <ThemedClerkProvider>{children}</ThemedClerkProvider>
    </NextThemesProvider>
  );
}
