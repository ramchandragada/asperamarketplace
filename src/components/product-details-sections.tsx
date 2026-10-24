import type {
  DescriptionBlock,
  HighlightRow,
  SpecGroup,
  WarrantyInfo,
} from "@/modules/catalogue/product-enrichment-types";

export function ProductDetailsSections({
  description,
  highlightRows,
  descriptionBlocks,
  specificationGroups,
  warranty,
}: {
  description: string;
  highlightRows: HighlightRow[];
  descriptionBlocks: DescriptionBlock[];
  specificationGroups: SpecGroup[];
  warranty: WarrantyInfo | null;
}) {
  const hasBlocks = descriptionBlocks.length > 0;
  const hasSpecs = specificationGroups.some((g) => g.rows.length > 0);

  return (
    <div className="mt-10 space-y-10 border-t border-border pt-10">
      <nav
        aria-label="Product details"
        className="flex flex-wrap gap-2 text-sm"
      >
        {[
          highlightRows.length > 0 ? ["highlights", "Highlights"] : null,
          ["description", "Description"],
          hasSpecs ? ["specifications", "Specifications"] : null,
          warranty ? ["warranty", "Warranty"] : null,
        ]
          .filter(Boolean)
          .map((item) => {
            const [id, label] = item as [string, string];
            return (
              <a
                key={id}
                href={`#${id}`}
                className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-3 py-1.5 font-medium text-foreground hover:border-accent hover:text-accent md:min-h-0"
              >
                {label}
              </a>
            );
          })}
      </nav>

      {highlightRows.length > 0 ? (
        <section id="highlights" className="scroll-mt-28">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Key highlights
          </h2>
          <ul className="mt-4 divide-y divide-border rounded-[var(--radius)] border border-border bg-surface">
            {highlightRows.map((row) => (
              <li
                key={row.label}
                className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] sm:gap-6"
              >
                <p className="text-sm font-semibold text-foreground">
                  {row.label}
                </p>
                {row.benefit ? (
                  <p className="text-sm text-muted">{row.benefit}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section id="description" className="scroll-mt-28">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Product description
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted whitespace-pre-wrap">
          {description}
        </p>
        {hasBlocks ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {descriptionBlocks.map((block) => (
              <article
                key={block.title}
                className="rounded-[var(--radius)] border border-border bg-surface p-4"
              >
                <h3 className="text-base font-semibold text-foreground">
                  {block.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">{block.body}</p>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      {hasSpecs ? (
        <section id="specifications" className="scroll-mt-28">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Specifications
          </h2>
          <div className="mt-4 space-y-6">
            {specificationGroups.map((group) =>
              group.rows.length === 0 ? null : (
                <div key={group.name}>
                  <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">
                    {group.name}
                  </h3>
                  <dl className="mt-2 overflow-hidden rounded-[var(--radius)] border border-border">
                    {group.rows.map((row, index) => (
                      <div
                        key={`${group.name}-${row.key}`}
                        className={`grid grid-cols-1 gap-1 px-4 py-2.5 text-sm sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-4 ${
                          index % 2 === 0 ? "bg-surface" : "bg-background"
                        }`}
                      >
                        <dt className="text-muted">{row.key}</dt>
                        <dd className="font-medium text-foreground">
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ),
            )}
          </div>
        </section>
      ) : null}

      {warranty ? (
        <section id="warranty" className="scroll-mt-28">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Warranty
          </h2>
          <dl className="mt-4 overflow-hidden rounded-[var(--radius)] border border-border">
            {(
              [
                ["Summary", warranty.summary],
                ["Covered", warranty.covered],
                ["Not covered", warranty.notCovered],
                ["Service type", warranty.serviceType],
              ] as const
            ).map(([key, value], index) => (
              <div
                key={key}
                className={`grid grid-cols-1 gap-1 px-4 py-2.5 text-sm sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-4 ${
                  index % 2 === 0 ? "bg-surface" : "bg-background"
                }`}
              >
                <dt className="text-muted">{key}</dt>
                <dd className="font-medium text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  );
}
