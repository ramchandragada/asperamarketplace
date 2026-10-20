/** Prefer field-level API errors over the generic validation message. */
export function apiErrorMessage(
  body: {
    message?: string;
    fieldErrors?: Record<string, string[]> | null;
  },
  fallback = "Check the submitted fields",
): string {
  const fieldErrors = body.fieldErrors;
  if (fieldErrors) {
    const parts = Object.entries(fieldErrors).flatMap(([field, messages]) =>
      (messages ?? []).map((message) => `${field}: ${message}`),
    );
    if (parts.length > 0) return parts.join("; ");
  }
  return body.message?.trim() || fallback;
}
