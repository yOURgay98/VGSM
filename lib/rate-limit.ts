interface RateLimitRecord {
  attempts: number;
  resetAt: number;
}

export class InMemoryRateLimiter {
  private readonly store = new Map<string, RateLimitRecord>();

  constructor(
    private readonly maxAttempts: number,
    private readonly windowMs: number,
  ) {}

  check(identifier: string) {
    const now = Date.now();
    const current = this.store.get(identifier);

    if (!current || current.resetAt < now) {
      this.store.set(identifier, { attempts: 1, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.maxAttempts - 1 };
    }

    if (current.attempts >= this.maxAttempts) {
      return { allowed: false, remaining: 0, resetAt: current.resetAt };
    }

    current.attempts += 1;
    this.store.set(identifier, current);

    return {
      allowed: true,
      remaining: this.maxAttempts - current.attempts,
      resetAt: current.resetAt,
    };
  }
}

export const loginRateLimiter = new InMemoryRateLimiter(5, 15 * 60 * 1000);
