export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};

export function clampTake(raw: unknown, opts: { defaultTake: number; maxTake: number }): number {
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  const take = Number.isFinite(n) ? Math.floor(n) : opts.defaultTake;
  return Math.min(Math.max(take, 1), opts.maxTake);
}

export function prismaIdCursor(cursor: string | null | undefined) {
  return cursor && cursor.trim().length ? { cursor: { id: cursor.trim() }, skip: 1 } : {};
}

export function toCursorPage<T extends { id: string }>(rows: T[], take: number): CursorPage<T> {
  const items = rows.slice(0, take);
  const nextCursor = rows.length > take ? (items[items.length - 1]?.id ?? null) : null;
  return { items, nextCursor };
}
