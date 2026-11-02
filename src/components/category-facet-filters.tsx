"use client";

import {
  CATALOGUE_FACET_OPTIONS,
  getCategoryFacetConfig,
  toggleFacetValue,
  type FacetSelection,
} from "@/modules/catalogue/category-facets";

export type FacetCountMap = Record<string, Record<string, number>>;

export function CategoryFacetFilters({
  categorySlug,
  selected,
  onChange,
  openSections,
  onToggleSection,
  counts,
}: {
  categorySlug: string;
  selected: FacetSelection;
  onChange: (next: FacetSelection) => void;
  openSections: Record<string, boolean>;
  onToggleSection: (key: string) => void;
  /** Live counts keyed by facet key → value → count. Hide zero when provided. */
  counts?: FacetCountMap | null;
}) {
  const config = getCategoryFacetConfig(categorySlug);
  if (!config) return null;
  const staticOptions = CATALOGUE_FACET_OPTIONS[categorySlug] ?? {};

  return (
    <>
      {config.facets.map((facet) => {
        const live = counts?.[facet.key];
        const values =
          live != null
            ? Object.keys(live).sort((a, b) => {
                if (facet.sort === "numeric") {
                  const an = Number(a.match(/(\d+(?:\.\d+)?)/)?.[1] ?? Infinity);
                  const bn = Number(b.match(/(\d+(?:\.\d+)?)/)?.[1] ?? Infinity);
                  return an - bn;
                }
                return a.localeCompare(b, "en", { numeric: true });
              })
            : (staticOptions[facet.key] ?? []);
        // Hide empty options when live counts are available; keep selected
        // values visible even if the current slice momentarily zeros them.
        const visibleValues =
          live != null
            ? values.filter(
                (value) =>
                  (live[value] ?? 0) > 0 ||
                  (selected[facet.key] ?? []).includes(value),
              )
            : values;
        if (visibleValues.length === 0) return null;
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
                {visibleValues.map((value) => {
                  const active = activeValues.includes(value);
                  const count = live?.[value];
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
                          {count != null ? (
                            <span className="ml-1 text-xs text-[#888]">
                              ({count})
                            </span>
                          ) : null}
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
