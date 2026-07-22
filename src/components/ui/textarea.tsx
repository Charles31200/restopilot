import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full resize-none rounded-(--radius-sm) border bg-surface px-3.5 py-2.5 text-[14.5px] text-ink placeholder:text-ink-subtle transition-colors outline-none focus:ring-2",
        invalid
          ? "border-danger-text focus:border-danger-text focus:ring-danger-soft"
          : "border-line-strong focus:border-blue focus:ring-blue-soft",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
