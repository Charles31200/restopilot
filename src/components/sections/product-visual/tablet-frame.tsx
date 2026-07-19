import { cn } from "@/lib/utils";

export function TabletFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border-[6px] border-ink bg-ink p-1.5 shadow-[0_30px_70px_-25px_rgba(16,17,19,0.35)]",
        className
      )}
    >
      <div className="overflow-hidden rounded-[18px] border border-line">
        {children}
      </div>
    </div>
  );
}
