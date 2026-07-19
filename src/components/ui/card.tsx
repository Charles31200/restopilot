import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-(--radius-lg) border border-line bg-surface",
        className
      )}
    >
      {children}
    </div>
  );
}
