/**
 * Seller catalogue pick — top-level groups over the flat PC category list.
 * DB Category.parentId is unused in the seed today; these groups give sellers
 * Category → Sub-category without a migration.
 */
export type CataloguePickGroup = {
  key: string;
  name: string;
  categorySlugs: readonly string[];
};

export const CATALOGUE_PICK_GROUPS: readonly CataloguePickGroup[] = [
  {
    key: "pc-components",
    name: "PC Components",
    categorySlugs: [
      "processors",
      "motherboards",
      "graphics-cards",
      "memory-ram",
      "storage-ssd",
      "power-supplies",
      "cpu-coolers",
      "cabinets",
    ],
  },
  {
    key: "peripherals",
    name: "Peripherals",
    categorySlugs: ["keyboard-mouse", "monitors", "ups"],
  },
  {
    key: "systems",
    name: "Systems",
    categorySlugs: ["laptops"],
  },
] as const;

export function pickGroupForCategorySlug(
  categorySlug: string,
): CataloguePickGroup | undefined {
  return CATALOGUE_PICK_GROUPS.find((group) =>
    group.categorySlugs.includes(categorySlug),
  );
}
