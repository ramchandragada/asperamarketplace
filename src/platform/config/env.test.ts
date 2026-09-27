import { describe, expect, it } from "vitest";
import { readPublicConfig } from "@/platform/config/env";

describe("readPublicConfig", () => {
  it("defaults the log level when it is unset", () => {
    expect(readPublicConfig({ NODE_ENV: "test" })).toEqual({
      NODE_ENV: "test",
      LOG_LEVEL: "info",
    });
  });

  it("rejects an unknown log level without echoing the value", () => {
    expect(() =>
      readPublicConfig({ NODE_ENV: "test", LOG_LEVEL: "super-secret-value" }),
    ).toThrowError(
      expect.objectContaining({
        message: expect.not.stringContaining("super-secret-value"),
      }),
    );
    expect(() =>
      readPublicConfig({ NODE_ENV: "test", LOG_LEVEL: "super-secret-value" }),
    ).toThrow("Invalid application configuration: LOG_LEVEL");
  });
});
