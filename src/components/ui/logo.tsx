import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  inverted,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2.5", className)}>
      <Image
        src="/brand/logo-mark-transparent.png"
        alt="PilotResto"
        width={4500}
        height={4500}
        priority
        className={cn("h-7 w-7 shrink-0 self-start", inverted && "brightness-0 invert")}
      />
      <span
        className={cn(
          "font-display text-[17px] font-semibold tracking-[-0.01em] text-ink",
          inverted && "text-white"
        )}
      >
        PilotResto
      </span>
    </span>
  );
}
