/** HTTP-mappable domain errors for API routes. */

import { DB_UUID_RE } from "@/platform/validation/id";

export class NotFoundError extends Error {
  readonly code = "NOT_FOUND";

  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class HttpValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "HttpValidationError";
    this.fieldErrors = fieldErrors;
  }
}

/** Accepts standard 8-4-4-4-12 hex UUIDs (Prisma @db.Uuid). */
export function assertUuid(
  value: string,
  field = "id",
): asserts value is string {
  if (!DB_UUID_RE.test(value)) {
    throw new HttpValidationError(`Invalid ${field}`, {
      [field]: ["Must be a valid UUID"],
    });
  }
}

export function isUuid(value: string): boolean {
  return DB_UUID_RE.test(value);
}
