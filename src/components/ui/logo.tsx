import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="26" height="26" rx="7" fill="var(--ink)" />
        <path
          d="M8 18V8h4.4a3.2 3.2 0 0 1 0 6.4H9.9"
          stroke="var(--accent)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-display text-[17px] font-semibold tracking-[-0.01em] text-ink">
        PilotResto
      </span>
    </span>
  );
}
