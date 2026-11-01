/**
 * Build a unique, schema-valid GSTIN for integration fixtures.
 * Production uniqueness on sellers.gstin means shared hardcodes collide.
 */
export function uniqueTestGstin(uniqueKey: string): string {
  let hash = 0;
  for (let i = 0; i < uniqueKey.length; i += 1) {
    hash = (hash * 33 + uniqueKey.charCodeAt(i)) >>> 0;
  }
  const digits = String(hash % 10_000).padStart(4, "0");
  const panLetter = String.fromCharCode(65 + (hash % 26));
  // >>> keeps the shift unsigned so % never yields a negative (invalid) check char.
  const check = ((hash >>> 8) % 36).toString(36).toUpperCase();
  return `29ABCDE${digits}${panLetter}1Z${check}`;
}
