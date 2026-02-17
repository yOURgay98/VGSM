"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const PING_INTERVAL_MS = 20_000;
const MIN_SEND_GAP_MS = 3_000;

export function PresencePinger() {
  const pathname = usePathname();
  const lastSentAt = useRef(0);

  function send(path: string) {
    const now = Date.now();
    if (now - lastSentAt.current < MIN_SEND_GAP_MS) return;
    lastSentAt.current = now;

    void fetch("/api/presence/ping", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path }),
      cache: "no-store",
      keepalive: true,
    }).catch(() => {
      // Presence is best-effort.
    });
  }

  useEffect(() => {
    send(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const handle = setInterval(() => send(pathname), PING_INTERVAL_MS);
    return () => clearInterval(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
