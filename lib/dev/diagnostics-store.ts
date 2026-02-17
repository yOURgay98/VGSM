export type DiagnosticLevel = "error" | "warn" | "unhandledrejection" | "windowerror";

export type DiagnosticEntry = {
  id: string;
  ts: number;
  level: DiagnosticLevel;
  message: string;
  stack?: string;
  route: string;
  count: number;
};

const MAX_ENTRIES = 300;
const STORE_KEY = "__ess_diagnostics_store_v1";

type Store = { entries: DiagnosticEntry[] };

function getStore(): Store {
  const target = globalThis as unknown as Record<string, unknown>;
  if (!target[STORE_KEY]) {
    target[STORE_KEY] = { entries: [] } satisfies Store;
  }
  return target[STORE_KEY] as Store;
}

function hashKey(
  level: DiagnosticLevel,
  message: string,
  stack: string | undefined,
  route: string,
) {
  return `${level}::${message}::${stack ?? ""}::${route}`;
}

export function pushDiagnostic(input: {
  level: DiagnosticLevel;
  message: string;
  stack?: string;
  route?: string;
}) {
  const store = getStore();
  const route =
    input.route ??
    (typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "unknown");
  const key = hashKey(input.level, input.message, input.stack, route);

  const existing = store.entries.find((entry) => entry.id === key);
  if (existing) {
    existing.ts = Date.now();
    existing.count += 1;
    return;
  }

  store.entries.unshift({
    id: key,
    ts: Date.now(),
    level: input.level,
    message: input.message,
    stack: input.stack,
    route,
    count: 1,
  });

  if (store.entries.length > MAX_ENTRIES) {
    store.entries.length = MAX_ENTRIES;
  }
}

export function listDiagnostics() {
  return [...getStore().entries].sort((a, b) => b.ts - a.ts);
}

export function clearDiagnostics() {
  getStore().entries = [];
}
