"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const NAV_CURRENT_KEY = "vsm:nav:current";
const NAV_PREVIOUS_KEY = "vsm:nav:previous";

export function NavigationSessionTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    const fullPath = `${pathname}${query ? `?${query}` : ""}`;

    try {
      const current = window.sessionStorage.getItem(NAV_CURRENT_KEY);
      if (current && current !== fullPath) {
        window.sessionStorage.setItem(NAV_PREVIOUS_KEY, current);
      }
      window.sessionStorage.setItem(NAV_CURRENT_KEY, fullPath);
    } catch {
      // Ignore session storage errors.
    }
  }, [pathname, searchParams]);

  return null;
}
