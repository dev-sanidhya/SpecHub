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
          "bg-[#222228] text-[#a0a0b0]": variant === "default",
          "bg-green-500/15 text-green-400": variant === "success",
          "bg-red-500/15 text-red-400": variant === "danger",
          "bg-amber-500/15 text-amber-400": variant === "warning",
          "bg-indigo-500/15 text-indigo-400": variant === "purple",
          "border border-[#2a2a32] text-[#a0a0b0]": variant === "outline",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
