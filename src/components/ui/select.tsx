import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(({ className, invalid, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "w-full appearance-none rounded-(--radius-sm) border bg-surface px-3.5 py-2.5 pr-9 text-[14.5px] text-ink transition-colors outline-none focus:ring-2",
        invalid
          ? "border-danger-text focus:border-danger-text focus:ring-danger-soft"
          : "border-line-strong focus:border-blue focus:ring-blue-soft",
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      size={16}
      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-subtle"
    />
  </div>
));
Select.displayName = "Select";
