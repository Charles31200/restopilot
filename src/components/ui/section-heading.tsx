import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
  eyebrowClassName,
  subtitleClassName,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
  eyebrowClassName?: string;
  subtitleClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow && (
        <Reveal>
          <span
            className={cn(
              "text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-subtle",
              eyebrowClassName
            )}
          >
            {eyebrow}
          </span>
        </Reveal>
      )}
      <Reveal delay={0.05}>
        <h2
          className={cn(
            "font-display font-semibold tracking-[-0.02em] text-ink text-balance",
            "text-[32px] leading-[1.15] md:text-[42px] md:leading-[1.1]"
          )}
        >
          {title}
        </h2>
      </Reveal>
      {subtitle && (
        <Reveal delay={0.1}>
          <p
            className={cn(
              "text-[17px] leading-[1.6] text-ink-muted text-balance",
              align === "center" ? "max-w-[560px]" : "max-w-[560px]",
              subtitleClassName
            )}
          >
            {subtitle}
          </p>
        </Reveal>
      )}
    </div>
  );
}
