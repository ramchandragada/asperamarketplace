import { describe, expect, it } from "vitest";
import { assertFulfilmentTransition, FulfilmentTransitionError } from "./states";

describe("fulfilment transitions", () => {
  it("allows pending → processing → shipped → delivered", () => {
    expect(() => assertFulfilmentTransition("pending", "processing")).not.toThrow();
    expect(() => assertFulfilmentTransition("processing", "shipped")).not.toThrow();
    expect(() => assertFulfilmentTransition("shipped", "delivered")).not.toThrow();
  });

  it("allows cancel from non-terminal states", () => {
    expect(() => assertFulfilmentTransition("pending", "cancelled")).not.toThrow();
    expect(() => assertFulfilmentTransition("processing", "cancelled")).not.toThrow();
    expect(() => assertFulfilmentTransition("shipped", "cancelled")).not.toThrow();
  });

  it("rejects illegal moves", () => {
    expect(() => assertFulfilmentTransition("pending", "shipped")).toThrow(
      FulfilmentTransitionError,
    );
    expect(() => assertFulfilmentTransition("delivered", "cancelled")).toThrow(
      FulfilmentTransitionError,
    );
  });
});
