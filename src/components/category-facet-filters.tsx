"use client";

import {
  CATALOGUE_FACET_OPTIONS,
  getCategoryFacetConfig,
} from "@/modules/catalogue/category-facets";

export function CategoryFacetFilters({
  categorySlug,
  selected,
  onChange,
  openSections,
  onToggleSection,
}: {
  categorySlug: string;
  selected: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
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
        const activeValue = selected[facet.key] ?? "";
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
                  const active = activeValue === value;
                  return (
                    <li key={value}>
                      <label className="flex cursor-pointer items-start gap-2 rounded px-1 py-1 text-sm hover:bg-surface">
                        <input
                          type="radio"
                          className="mt-1"
                          name={`facet-${facet.key}`}
                          checked={active}
                          onChange={() => {
                            const next = { ...selected };
                            if (active) delete next[facet.key];
                            else next[facet.key] = value;
                            onChange(next);
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
                {activeValue ? (
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
