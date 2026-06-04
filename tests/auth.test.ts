import { describe, expect, it } from "vitest";

import { ChangePasswordSchema, RegisterSchema } from "@/server/auth/service";
import { assertLoginAllowed, clearLoginAttempts } from "@/server/auth/rate-limit";

describe("auth validation", () => {
  it("requires strong enough passwords", () => {
    expect(RegisterSchema.safeParse({
      email: "user@example.com",
      displayName: "User",
      password: "password",
    }).success).toBe(false);

    expect(RegisterSchema.safeParse({
      email: "user@example.com",
      displayName: "User",
      password: "Password1",
    }).success).toBe(true);
  });

  it("uses the same password rules when changing passwords", () => {
    expect(ChangePasswordSchema.safeParse({
      currentPassword: "Password1",
      newPassword: "short",
    }).success).toBe(false);

    expect(ChangePasswordSchema.safeParse({
      currentPassword: "Password1",
      newPassword: "NewPassword1",
    }).success).toBe(true);
  });
});

describe("login rate limit", () => {
  it("allows five attempts per window then rejects", () => {
    const key = "rate-limit@example.com";
    clearLoginAttempts(key);
    for (let i = 0; i < 5; i += 1) {
      expect(() => assertLoginAllowed(key, 1_000)).not.toThrow();
    }
    expect(() => assertLoginAllowed(key, 1_000)).toThrow("Too many login attempts");
    clearLoginAttempts(key);
  });

  it("resets after the window expires", () => {
    const key = "rate-limit-reset@example.com";
    clearLoginAttempts(key);
    for (let i = 0; i < 5; i += 1) {
      assertLoginAllowed(key, 1_000);
    }
    expect(() => assertLoginAllowed(key, 16 * 60 * 1_000)).not.toThrow();
    clearLoginAttempts(key);
  });
});
