"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("spechub-theme") ?? "dark";
    const isDark = stored === "dark";
    setDark(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setMounted(true);
  }, []);

  function toggle() {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("spechub-theme", "light");
      setDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("spechub-theme", "dark");
      setDark(true);
    }
  }

  if (!mounted) return <div className="w-8 h-8" />;

  return (
    <button
      onClick={toggle}
      className={`w-8 h-8 flex items-center justify-center rounded-lg text-foreground-3 hover:text-foreground hover:bg-surface-3 transition-colors ${className}`}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
