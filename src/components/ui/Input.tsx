import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm text-foreground-2 font-medium">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            "h-12 rounded-[1.15rem] border border-border bg-surface px-4 text-sm text-foreground shadow-[0_18px_36px_-28px_var(--shadow-color)] placeholder:text-foreground-3 transition-colors focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/12",
            error && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
