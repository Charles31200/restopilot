import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-(--radius-sm) border bg-surface px-3.5 py-2.5 text-[14.5px] text-ink placeholder:text-ink-subtle transition-colors outline-none focus:ring-2",
        invalid
          ? "border-danger-text focus:border-danger-text focus:ring-danger-soft"
          : "border-line-strong focus:border-blue focus:ring-blue-soft",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
