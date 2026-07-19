import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  icon,
}: {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 py-1 text-[13px] font-medium text-ink-muted",
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
