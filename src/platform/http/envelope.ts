export type FieldErrors = Record<string, string[]>;

export type ApiSuccess<T> = {
  data: T;
  error: null;
  code: "OK";
  message: string;
  fieldErrors: null;
  requestId: string;
};

export type ApiFailure = {
  data: null;
  error: string;
  code: string;
  message: string;
  fieldErrors: FieldErrors | null;
  requestId: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(
  data: T,
  requestId: string,
  message = "OK",
): ApiSuccess<T> {
  return {
    data,
    error: null,
    code: "OK",
    message,
    fieldErrors: null,
    requestId,
  };
}

export function fail(input: {
  requestId: string;
  code: string;
  message: string;
  error?: string;
  fieldErrors?: FieldErrors | null;
}): ApiFailure {
  return {
    data: null,
    error: input.error ?? input.message,
    code: input.code,
    message: input.message,
    fieldErrors: input.fieldErrors ?? null,
    requestId: input.requestId,
  };
}
