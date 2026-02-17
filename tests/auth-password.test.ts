import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "../lib/auth/password";

describe("auth password service", () => {
  it("hashes and verifies correct password", async () => {
    const password = "ChangeMe123!";
    const hash = await hashPassword(password);

    expect(hash).not.toEqual(password);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
  });

  it("rejects invalid password", async () => {
    const hash = await hashPassword("CorrectPass123!");

    await expect(verifyPassword("WrongPass123!", hash)).resolves.toBe(false);
  });
});
