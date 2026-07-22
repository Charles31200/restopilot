"use client";

import { motion, useReducedMotion } from "framer-motion";

const nodes = Array.from({ length: 5 }, (_, i) => {
  const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
  return {
    x: 200 + Math.cos(angle) * 148,
    y: 200 + Math.sin(angle) * 148,
    delay: i * 0.15,
  };
});

export function AINetworkSchema() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      <svg
        viewBox="0 0 400 400"
        className="h-full w-full"
        aria-hidden="true"
      >
        <circle
          cx="200"
          cy="200"
          r="148"
          fill="none"
          stroke="var(--line)"
          strokeWidth="1"
          strokeDasharray="2 6"
        />

        {nodes.map((n, i) => (
          <line
            key={i}
            x1="200"
            y1="200"
            x2={n.x}
            y2={n.y}
            stroke="var(--line-strong)"
            strokeWidth="1"
          />
        ))}

        {nodes.map((n, i) => (
          <motion.circle
            key={i}
            cx={n.x}
            cy={n.y}
            r="7"
            fill="var(--ink)"
            initial={{ opacity: 0.3 }}
            animate={
              reduceMotion
                ? { opacity: 0.9 }
                : { opacity: [0.35, 1, 0.35] }
            }
            transition={{
              duration: 3.2,
              repeat: Infinity,
              delay: n.delay,
              ease: "easeInOut",
            }}
          />
        ))}

        <circle cx="200" cy="200" r="40" fill="var(--ink)" />
      </svg>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.6" />
          </svg>
        </span>
      </div>
    </div>
  );
}
