import Link from "next/link";
import { cn } from "@/lib/utils";

type CommonProps = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  className?: string;
  children: React.ReactNode;
};

type ButtonAsLink = CommonProps & {
  href: string;
  external?: boolean;
  onClick?: () => void;
};

type ButtonAsButton = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

const base =
  "inline-flex items-center justify-center gap-2 font-medium tracking-[-0.01em] transition-all duration-200 ease-out focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

const variants = {
  primary:
    "bg-ink text-ink-inverse hover:bg-[#26262a] shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset,0_10px_24px_-12px_rgba(16,17,19,0.45)]",
  secondary:
    "bg-surface text-ink border border-line-strong hover:border-ink hover:bg-canvas-alt",
  ghost: "text-ink-muted hover:text-ink",
};

const sizes = {
  md: "h-10 px-4 text-sm rounded-(--radius-sm)",
  lg: "h-12 px-6 text-[15px] rounded-(--radius-md)",
};

export function Button(props: ButtonAsLink | ButtonAsButton) {
  const {
    variant = "primary",
    size = "md",
    className,
    children,
    ...rest
  } = props;

  const classes = cn(base, variants[variant], sizes[size], className);

  if ("href" in props && props.href) {
    const { href, external, onClick } = props;
    if (external) {
      return (
        <a
          href={href}
          className={classes}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClick}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {children}
      </Link>
    );
  }

  const buttonRest = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={classes} {...buttonRest}>
      {children}
    </button>
  );
}
