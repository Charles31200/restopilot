"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          initial={{ opacity: 0, y: 8, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.9 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          aria-label="Revenir en haut de la page"
          className="no-print fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-surface text-ink shadow-[0_12px_32px_-12px_rgba(16,17,19,0.3)] transition-colors hover:border-ink"
        >
          <ArrowUp size={18} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
