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
          "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none",
          {
            "bg-accent text-white hover:bg-[var(--accent-hover)] active:scale-[0.98]":
              variant === "primary",
            "bg-surface-3 text-foreground border border-border-2 hover:bg-surface-3 active:scale-[0.98]":
              variant === "secondary",
            "text-foreground-2 hover:text-foreground hover:bg-surface-3 active:scale-[0.98]":
              variant === "ghost",
            "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 active:scale-[0.98]":
              variant === "danger",
            "border border-border-2 text-foreground hover:border-indigo-500/50 hover:text-accent active:scale-[0.98]":
              variant === "outline",
          },
          {
            "text-xs px-2.5 py-1.5 h-7": size === "sm",
            "text-sm px-4 py-2 h-9": size === "md",
            "text-sm px-6 py-2.5 h-11": size === "lg",
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
