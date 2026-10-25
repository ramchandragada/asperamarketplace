"use client";

import {
  CATALOGUE_FACET_OPTIONS,
  getCategoryFacetConfig,
  toggleFacetValue,
  type FacetSelection,
} from "@/modules/catalogue/category-facets";

export function CategoryFacetFilters({
  categorySlug,
  selected,
  onChange,
  openSections,
  onToggleSection,
}: {
  categorySlug: string;
  selected: FacetSelection;
  onChange: (next: FacetSelection) => void;
  openSections: Record<string, boolean>;
  onToggleSection: (key: string) => void;
}) {
  const config = getCategoryFacetConfig(categorySlug);
  if (!config) return null;
  const options = CATALOGUE_FACET_OPTIONS[categorySlug] ?? {};

  return (
    <>
      {config.facets.map((facet) => {
        const values = options[facet.key] ?? [];
        if (values.length === 0) return null;
        const sectionKey = `facet:${facet.key}`;
        const open = openSections[sectionKey] !== false;
        const activeValues = selected[facet.key] ?? [];
        return (
          <section key={facet.key} className="border-b border-border py-3">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 text-left text-sm font-semibold text-foreground"
              aria-expanded={open}
              onClick={() => onToggleSection(sectionKey)}
            >
              <span>{facet.label}</span>
              <span className="text-muted" aria-hidden>
                {open ? "−" : "+"}
              </span>
            </button>
            {open ? (
              <ul className="mt-2 max-h-52 space-y-1 overflow-y-auto pr-1">
                {values.map((value) => {
                  const active = activeValues.includes(value);
                  return (
                    <li key={value}>
                      <label className="flex cursor-pointer items-start gap-2 rounded px-1 py-1 text-sm hover:bg-surface">
                        <input
                          type="checkbox"
                          className="mt-1 h-3.5 w-3.5 accent-[var(--accent)]"
                          checked={active}
                          onChange={() => {
                            onChange(
                              toggleFacetValue(selected, facet.key, value),
                            );
                          }}
                        />
                        <span
                          className={
                            active
                              ? "font-medium text-foreground"
                              : "text-muted"
                          }
                        >
                          {value}
                        </span>
                      </label>
                    </li>
                  );
                })}
                {activeValues.length > 0 ? (
                  <li>
                    <button
                      type="button"
                      className="mt-1 text-xs font-medium text-accent hover:underline"
                      onClick={() => {
                        const next = { ...selected };
                        delete next[facet.key];
                        onChange(next);
                      }}
                    >
                      Clear {facet.label.toLowerCase()}
                    </button>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </section>
        );
      })}
    </>
  );
}
