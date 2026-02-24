"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

export function PublicPageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div key={pathname}>{children}</div>;
  }

  return (
    <AnimatePresence initial mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -6, filter: "blur(1px)" }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="will-change-[opacity,transform,filter]"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
