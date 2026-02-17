import { describe, expect, it } from "vitest";

import { clampTake, toCursorPage } from "@/lib/db/pagination";

describe("pagination helpers", () => {
  it("clampTake clamps and defaults", () => {
    expect(clampTake(undefined, { defaultTake: 50, maxTake: 200 })).toBe(50);
    expect(clampTake("not-a-number", { defaultTake: 50, maxTake: 200 })).toBe(50);
    expect(clampTake(0, { defaultTake: 50, maxTake: 200 })).toBe(1);
    expect(clampTake(999, { defaultTake: 50, maxTake: 200 })).toBe(200);
  });

  it("toCursorPage returns nextCursor only when there is an extra row", () => {
    const rows = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const page = toCursorPage(rows, 2);
    expect(page.items.map((r) => r.id)).toEqual(["a", "b"]);
    expect(page.nextCursor).toBe("b");

    const page2 = toCursorPage([{ id: "x" }, { id: "y" }], 2);
    expect(page2.items.map((r) => r.id)).toEqual(["x", "y"]);
    expect(page2.nextCursor).toBeNull();
  });
});
