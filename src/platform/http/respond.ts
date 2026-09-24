import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { fail, ok } from "@/platform/http/envelope";
import { REQUEST_ID_HEADER, resolveRequestId } from "@/platform/http/request-id";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/modules/identity/policy";
import { ConflictError as IdentityConflictError } from "@/modules/identity/service";
import {
  ConflictError as SellerConflictError,
  ValidationError,
} from "@/modules/seller/service";
import { SellerTransitionError } from "@/modules/seller/states";
import { StorageValidationError } from "@/platform/storage/local";

export function getRequestId(request: Request): string {
  return resolveRequestId(request.headers.get(REQUEST_ID_HEADER));
}

export function jsonOk<T>(
  data: T,
  requestId: string,
  init?: { status?: number; message?: string; headers?: HeadersInit },
) {
  const response = NextResponse.json(
    ok(data, requestId, init?.message ?? "OK"),
    { status: init?.status ?? 200 },
  );
  response.headers.set(REQUEST_ID_HEADER, requestId);
  if (init?.headers) {
    const headers = new Headers(init.headers);
    headers.forEach((value, key) => response.headers.set(key, value));
  }
  return response;
}

export function jsonError(
  requestId: string,
  error: unknown,
) {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "_form";
      fieldErrors[key] ??= [];
      fieldErrors[key].push(issue.message);
    }
    return NextResponse.json(
      fail({
        requestId,
        code: "VALIDATION_ERROR",
        message: "Check the submitted fields",
        fieldErrors,
      }),
      {
        status: 400,
        headers: { [REQUEST_ID_HEADER]: requestId },
      },
    );
  }

  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      fail({
        requestId,
        code: error.code,
        message: error.message,
      }),
      { status: 401, headers: { [REQUEST_ID_HEADER]: requestId } },
    );
  }

  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      fail({
        requestId,
        code: error.code,
        message: error.message,
      }),
      { status: 403, headers: { [REQUEST_ID_HEADER]: requestId } },
    );
  }

  if (
    error instanceof IdentityConflictError ||
    error instanceof SellerConflictError
  ) {
    return NextResponse.json(
      fail({
        requestId,
        code: error.code,
        message: error.message,
      }),
      { status: 409, headers: { [REQUEST_ID_HEADER]: requestId } },
    );
  }

  if (
    error instanceof ValidationError ||
    error instanceof StorageValidationError ||
    error instanceof SellerTransitionError
  ) {
    return NextResponse.json(
      fail({
        requestId,
        code: error.code,
        message: error.message,
      }),
      { status: 400, headers: { [REQUEST_ID_HEADER]: requestId } },
    );
  }

  return NextResponse.json(
    fail({
      requestId,
      code: "INTERNAL_ERROR",
      message: "Unexpected server error",
    }),
    { status: 500, headers: { [REQUEST_ID_HEADER]: requestId } },
  );
}

export function requestMeta(request: Request) {
  return {
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}
