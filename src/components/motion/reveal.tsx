"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

const distances = { sm: 12, md: 20, lg: 32 };

export function Reveal({
  children,
  className,
  delay = 0,
  distance = "md",
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  distance?: keyof typeof distances;
  as?: "div" | "span" | "li";
}) {
  const shouldReduceMotion = useReducedMotion();

  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : distances[distance],
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        delay,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const shared = {
    className: cn(className),
    initial: "hidden" as const,
    whileInView: "visible" as const,
    viewport: { once: true, margin: "-80px" },
    variants,
  };

  if (as === "span") return <motion.span {...shared}>{children}</motion.span>;
  if (as === "li") return <motion.li {...shared}>{children}</motion.li>;
  return <motion.div {...shared}>{children}</motion.div>;
}

export function RevealGroup({
  children,
  className,
  stagger = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  const variants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
      },
    },
  };

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
  distance = "md",
}: {
  children: React.ReactNode;
  className?: string;
  distance?: keyof typeof distances;
}) {
  const shouldReduceMotion = useReducedMotion();

  const variants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : distances[distance] },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <motion.div className={cn(className)} variants={variants}>
      {children}
    </motion.div>
  );
}
