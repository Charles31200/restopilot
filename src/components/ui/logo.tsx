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
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-2",
        inverted && "brightness-0 invert",
        className
      )}
    >
      <Image
        src="/brand/logo-mark-transparent.png"
        alt=""
        aria-hidden="true"
        width={4500}
        height={4500}
        priority
        className="h-7 w-7 shrink-0 self-start"
      />
      <Image
        src="/brand/logo-wordmark-transparent.png"
        alt="PilotResto"
        width={5692}
        height={3200}
        priority
        className="h-5 w-auto shrink-0 self-start"
      />
    </span>
  );
}
