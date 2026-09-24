import { describe, expect, it } from "vitest";
import { createLogger } from "@/platform/logging/logger";
import { redact } from "@/platform/logging/redact";

describe("redact", () => {
  it("removes credentials, tokens, and card numbers", () => {
    const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.signature1";
    const result = redact({
      password: "hunter2",
      authorization: "Bearer live-token",
      cardNumber: "4242424242424242",
      note: `paid with bearer abc.def and ${jwt}`,
      requestId: "req-1",
      nested: { gstin: "29ABCDE1234F1Z5" },
    });

    expect(result).toMatchObject({
      password: "[redacted]",
      authorization: "[redacted]",
      cardNumber: "[redacted]",
      requestId: "req-1",
      nested: { gstin: "[redacted]" },
    });
    expect(JSON.stringify(result)).not.toContain("hunter2");
    expect(JSON.stringify(result)).not.toContain("live-token");
    expect(JSON.stringify(result)).not.toContain("4242424242424242");
    expect(JSON.stringify(result)).not.toContain("eyJhbGci");
  });

  it("writes redacted structured logs", () => {
    const lines: string[] = [];
    const logger = createLogger((_level, line) => {
      lines.push(line);
    }, "info");

    logger.debug("skipped", { password: "secret" });
    logger.info("auth.failed", {
      password: "secret",
      requestId: "req-9",
    });

    expect(lines).toHaveLength(1);
    const entry = JSON.parse(lines[0] ?? "{}") as {
      password?: string;
      requestId?: string;
      level?: string;
      message?: string;
    };
    expect(entry.password).toBe("[redacted]");
    expect(entry.requestId).toBe("req-9");
    expect(entry.level).toBe("info");
    expect(entry.message).toBe("auth.failed");
    expect(lines[0]).not.toContain("secret");
  });
});
