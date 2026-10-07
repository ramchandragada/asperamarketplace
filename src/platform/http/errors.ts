/** HTTP-mappable domain errors for API routes. */

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
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function assertUuid(
  value: string,
  field = "id",
): asserts value is string {
  if (!UUID_RE.test(value)) {
    throw new HttpValidationError(`Invalid ${field}`, {
      [field]: ["Must be a valid UUID"],
    });
  }
}

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
