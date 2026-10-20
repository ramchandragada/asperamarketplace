/** JSON-LD safe for embedding in a script tag. Escapes `<` so `</script>` cannot break out. */
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
