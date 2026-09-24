import { describe, expect, it } from "vitest";
import { fail, ok } from "@/platform/http/envelope";

describe("api envelope", () => {
  it("returns the success fields", () => {
    expect(ok({ status: "ok" }, "req-1", "Service is ready")).toEqual({
      data: { status: "ok" },
      error: null,
      code: "OK",
      message: "Service is ready",
      fieldErrors: null,
      requestId: "req-1",
    });
  });

  it("returns field errors without a data payload", () => {
    expect(
      fail({
        requestId: "req-2",
        code: "VALIDATION_ERROR",
        message: "Check the submitted fields",
        fieldErrors: { email: ["Required"] },
      }),
    ).toEqual({
      data: null,
      error: "Check the submitted fields",
      code: "VALIDATION_ERROR",
      message: "Check the submitted fields",
      fieldErrors: { email: ["Required"] },
      requestId: "req-2",
    });
  });
});
