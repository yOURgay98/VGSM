"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export function MarketingBackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const shouldShow = useMemo(() => {
    if (typeof window === "undefined") return false;

    let hasInternalPrev = false;
    try {
      const previous = window.sessionStorage.getItem("vsm:nav:previous");
      hasInternalPrev = Boolean(previous && previous !== pathname);
    } catch {
      hasInternalPrev = false;
    }

    let sameOriginReferrer = false;
    try {
      if (document.referrer) {
        const ref = new URL(document.referrer);
        sameOriginReferrer = ref.origin === window.location.origin;
      }
    } catch {
      sameOriginReferrer = false;
    }

    const hasHistory = window.history.length > 1;
    return hasInternalPrev || sameOriginReferrer || hasHistory;
  }, [pathname]);

  useEffect(() => {
    setVisible(shouldShow);
  }, [shouldShow]);

  const onBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }, [fallbackHref, router]);

  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
        >
          <Button type="button" variant="outline" onClick={onBack} aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
