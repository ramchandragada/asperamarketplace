import { describe, expect, it } from "vitest";
import { isLoginLocked, LOGIN_LOCK_THRESHOLD } from "./login-guard";

describe("login lockout", () => {
  it("locks after the failure threshold", () => {
    expect(isLoginLocked(LOGIN_LOCK_THRESHOLD - 1)).toBe(false);
    expect(isLoginLocked(LOGIN_LOCK_THRESHOLD)).toBe(true);
  });
});
