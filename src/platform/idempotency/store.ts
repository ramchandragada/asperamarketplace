import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/platform/db/prisma";

export class IdempotencyConflictError extends Error {
  readonly code = "IDEMPOTENCY_CONFLICT";
  constructor(message: string) {
    super(message);
    this.name = "IdempotencyConflictError";
  }
}

export function hashIdempotencyPayload(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

/**
 * Begin an idempotent command. Returns a cached response body when the same
 * key+scope+payload already completed. Throws when the key was reused with a
 * different payload.
 */
export async function beginIdempotentCommand<T>(input: {
  key: string;
  scope: string;
  requestPayload: unknown;
}): Promise<{ kind: "cached"; body: T } | { kind: "fresh" }> {
  const requestHash = hashIdempotencyPayload(input.requestPayload);
  const existing = await prisma.idempotencyRecord.findUnique({
    where: {
      key_scope: { key: input.key, scope: input.scope },
    },
  });

  if (!existing) {
    try {
      await prisma.idempotencyRecord.create({
        data: {
          key: input.key,
          scope: input.scope,
          requestHash,
          status: "started",
        },
      });
      return { kind: "fresh" };
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002"
      ) {
        throw error;
      }
      const raced = await prisma.idempotencyRecord.findUnique({
        where: { key_scope: { key: input.key, scope: input.scope } },
      });
      if (!raced) throw error;
      if (raced.requestHash !== requestHash) {
        throw new IdempotencyConflictError(
          "Idempotency key was reused with a different request body",
        );
      }
      if (raced.status === "completed" && raced.responseBody != null) {
        return { kind: "cached", body: raced.responseBody as T };
      }
      throw new IdempotencyConflictError(
        "This request is already in progress. Retry shortly.",
      );
    }
  }

  if (existing.requestHash !== requestHash) {
    throw new IdempotencyConflictError(
      "Idempotency key was reused with a different request body",
    );
  }

  if (existing.status === "completed" && existing.responseBody != null) {
    return { kind: "cached", body: existing.responseBody as T };
  }

  return { kind: "fresh" };
}

export async function completeIdempotentCommand(input: {
  key: string;
  scope: string;
  responseCode: string;
  responseBody: unknown;
}) {
  await prisma.idempotencyRecord.update({
    where: {
      key_scope: { key: input.key, scope: input.scope },
    },
    data: {
      status: "completed",
      responseCode: input.responseCode,
      responseBody: input.responseBody as object,
    },
  });
}
