import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "danger" | "warning" | "purple" | "outline";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
        {
          "bg-surface-3 text-foreground-2": variant === "default",
          "bg-green-500/15 text-green-600 dark:text-green-400": variant === "success",
          "bg-red-500/15 text-red-600 dark:text-red-400": variant === "danger",
          "bg-amber-500/15 text-amber-600 dark:text-amber-400": variant === "warning",
          "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400": variant === "purple",
          "border border-border-2 text-foreground-2": variant === "outline",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
