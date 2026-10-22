/**
 * Catalogue v2 (shared catalogue + seller offers) rollout flag.
 *
 * OFF by default everywhere — the storefront keeps reading the current
 * per-seller product model until we deliberately flip this on (preview first,
 * then production). Enable by setting CATALOGUE_V2=true. See
 * docs/CATALOGUE_V2_PLAN.md.
 */
export function catalogueV2Enabled(): boolean {
  return process.env.CATALOGUE_V2 === "true";
}
