import { cn } from "@/lib/utils";

export function PhoneFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-[36px] border-[6px] border-ink bg-ink p-1.5 shadow-[0_30px_70px_-25px_rgba(16,17,19,0.4)]",
        className
      )}
    >
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-3 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-ink"
      />
      <div className="overflow-hidden rounded-[28px] border border-line">
        {children}
      </div>
    </div>
  );
}
