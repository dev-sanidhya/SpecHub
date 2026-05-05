"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  function toggle() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  if (!resolvedTheme) return <div className="h-9 w-9" />;

  const dark = resolvedTheme !== "light";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface/90 text-foreground-2 shadow-[0_18px_36px_-24px_var(--shadow-color)] backdrop-blur transition-all hover:-translate-y-0.5 hover:border-border-2 hover:bg-surface-2 hover:text-foreground ${className}`}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
