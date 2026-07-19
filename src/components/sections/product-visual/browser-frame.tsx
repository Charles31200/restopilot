import { cn } from "@/lib/utils";

export function BrowserFrame({
  children,
  className,
  label = "app.pilotresto.pro",
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-(--radius-xl) border border-line bg-surface shadow-[0_30px_80px_-30px_rgba(16,17,19,0.18)]",
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-line bg-canvas-alt px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        </div>
        <div className="mx-auto flex h-6 w-full max-w-[240px] items-center justify-center rounded-full bg-surface text-[11px] text-ink-subtle">
          {label}
        </div>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
