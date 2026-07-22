import { forwardRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: React.ReactNode;
  invalid?: boolean;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, invalid, className, id, ...props }, ref) => (
    <label
      htmlFor={id}
      className={cn(
        "group flex cursor-pointer items-start gap-3 text-[13.5px] leading-[1.5] text-ink-muted",
        className
      )}
    >
      <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className={cn(
            "peer h-5 w-5 shrink-0 appearance-none rounded-[5px] border bg-surface transition-colors checked:bg-ink checked:border-ink focus-visible:outline-2 focus-visible:outline-blue focus-visible:outline-offset-2",
            invalid ? "border-danger-text" : "border-line-strong"
          )}
          {...props}
        />
        <Check
          size={13}
          strokeWidth={3}
          className="pointer-events-none absolute text-white opacity-0 peer-checked:opacity-100"
        />
      </span>
      {label}
    </label>
  )
);
Checkbox.displayName = "Checkbox";
