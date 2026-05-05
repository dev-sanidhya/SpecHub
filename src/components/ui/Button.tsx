"use client";

import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 select-none focus-visible:outline-none",
          {
            "bg-accent text-white shadow-[0_20px_44px_-20px_var(--accent)] hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] hover:shadow-[0_24px_56px_-22px_var(--accent)] active:translate-y-0 active:scale-[0.99]":
              variant === "primary",
            "border border-border bg-surface text-foreground shadow-[0_16px_34px_-26px_var(--shadow-color)] hover:-translate-y-0.5 hover:bg-surface-2 active:translate-y-0 active:scale-[0.99]":
              variant === "secondary",
            "text-foreground-2 hover:bg-surface-2 hover:text-foreground active:scale-[0.99]":
              variant === "ghost",
            "border border-red-500/20 bg-red-500/10 text-red-500 hover:-translate-y-0.5 hover:bg-red-500/18 active:translate-y-0 active:scale-[0.99]":
              variant === "danger",
            "border border-border bg-transparent text-foreground hover:-translate-y-0.5 hover:border-indigo-500/40 hover:bg-indigo-500/6 hover:text-accent active:translate-y-0 active:scale-[0.99]":
              variant === "outline",
          },
          {
            "h-9 px-4 text-xs": size === "sm",
            "h-11 px-5 text-sm": size === "md",
            "h-12 px-6 text-sm": size === "lg",
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
