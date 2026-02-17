"use client";

import { useEffect } from "react";

import { pushDiagnostic } from "@/lib/dev/diagnostics-store";

const PATCHED_KEY = "__ess_diag_capture_patched_v1";

function normalizeArgs(args: unknown[]) {
  return args
    .map((arg) => {
      if (typeof arg === "string") return arg;
      if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(" ");
}

export function DiagnosticsCapture() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (typeof window === "undefined") return;

    const wasPatched = Boolean(Reflect.get(window, PATCHED_KEY));
    if (wasPatched) return;
    Reflect.set(window, PATCHED_KEY, true);

    const originalError = console.error.bind(console);
    const originalWarn = console.warn.bind(console);

    console.error = (...args: unknown[]) => {
      const message = normalizeArgs(args);
      const stack = args.find((arg) => arg instanceof Error) as Error | undefined;
      pushDiagnostic({ level: "error", message, stack: stack?.stack });
      originalError(...args);
    };

    console.warn = (...args: unknown[]) => {
      const message = normalizeArgs(args);
      const stack = args.find((arg) => arg instanceof Error) as Error | undefined;
      pushDiagnostic({ level: "warn", message, stack: stack?.stack });
      originalWarn(...args);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error ? `${reason.name}: ${reason.message}` : normalizeArgs([reason]);
      pushDiagnostic({
        level: "unhandledrejection",
        message,
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    };

    const onWindowError = (event: ErrorEvent) => {
      pushDiagnostic({
        level: "windowerror",
        message: event.message || "window.onerror",
        stack: event.error instanceof Error ? event.error.stack : undefined,
      });
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onWindowError);

    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onWindowError);
      console.error = originalError;
      console.warn = originalWarn;
      Reflect.set(window, PATCHED_KEY, false);
    };
  }, []);

  return null;
}
