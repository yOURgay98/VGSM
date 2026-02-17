import { describe, expect, it } from "vitest";

import { InMemoryRateLimiter } from "../lib/rate-limit";

describe("login rate limiter", () => {
  it("blocks after max attempts", () => {
    const limiter = new InMemoryRateLimiter(2, 10_000);

    expect(limiter.check("user:a").allowed).toBe(true);
    expect(limiter.check("user:a").allowed).toBe(true);
    expect(limiter.check("user:a").allowed).toBe(false);
  });
});
