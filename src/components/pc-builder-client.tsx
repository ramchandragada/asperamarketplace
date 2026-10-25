"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BUILDER_PRESETS,
  BUILDER_SLOTS,
  buildShareQuery,
  compatibilityFacetsForSlot,
  compatibilityLockLabels,
  evaluateCompatibility,
  estimateSystemWattage,
  formatPaiseINR,
  nextEmptyBuilderSlot,
  partMatchesCompatibilityFacets,
  pruneIncompatibleSelection,
  searchHintForSlot,
  type BuilderPart,
  type BuilderPresetId,
  type BuilderSelection,
  type BuilderSlotId,
} from "@/lib/pc-builder";

type PartsResponse = {
  data?: {
    items: BuilderPart[];
    total: number;
    page: number;
    pageSize: number;
  };
  message?: string;
};

function facetQuery(facets: Record<string, string[]>): string {
  const params = new URLSearchParams();
  for (const [key, values] of Object.entries(facets)) {
    for (const value of values) params.append(`facet.${key}`, value);
  }
  return params.toString();
}

export function PcBuilderClient({
  initialSlugs = {},
  initialPreset = null,
}: {
  initialSlugs?: Partial<Record<BuilderSlotId, string>>;
  initialPreset?: BuilderPresetId | null;
}) {
  const router = useRouter();
  const [selection, setSelection] = useState<BuilderSelection>({});
  const [activeSlot, setActiveSlot] = useState<BuilderSlotId>("cpu");
  const [parts, setParts] = useState<BuilderPart[]>([]);
  const [totalParts, setTotalParts] = useState(0);
  const [query, setQuery] = useState(() => {
    if (!initialPreset) return "";
    return (
      BUILDER_PRESETS.find((entry) => entry.id === initialPreset)?.hints.cpu
        ?.q ?? ""
    );
  });
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [preset, setPreset] = useState<BuilderPresetId | null>(initialPreset);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hideEmpty, setHideEmpty] = useState(false);

  const issues = useMemo(
    () => evaluateCompatibility(selection),
    [selection],
  );
  const power = useMemo(
    () => estimateSystemWattage(selection),
    [selection],
  );
  const totalPaise = useMemo(
    () =>
      BUILDER_SLOTS.reduce(
        (sum, slot) => sum + (selection[slot.id]?.pricePaise ?? 0),
        0,
      ),
    [selection],
  );
  const configuredCount = BUILDER_SLOTS.filter(
    (slot) => selection[slot.id],
  ).length;
  const requiredReady = BUILDER_SLOTS.filter((s) => s.required).every(
    (s) => selection[s.id],
  );
  const hasBlockingError = issues.some((issue) => issue.severity === "error");

  const loadParts = useCallback(
    async (
      slotId: BuilderSlotId,
      q: string,
      current: BuilderSelection,
      activePreset: BuilderPresetId | null,
    ) => {
      setLoading(true);
      setError(null);
      try {
        // Compat locks win over preset nudges when keys collide.
        const presetFacets = activePreset
          ? (BUILDER_PRESETS.find((entry) => entry.id === activePreset)?.hints[
              slotId
            ]?.facets ?? {})
          : {};
        const compatFacets = compatibilityFacetsForSlot(slotId, current);
        const facets = {
          ...presetFacets,
          ...compatFacets,
        };
        const params = new URLSearchParams({
          slot: slotId,
          pageSize: "24",
          inStockOnly: "true",
        });
        if (q.trim()) params.set("q", q.trim());
        const facetQs = facetQuery(facets);
        const response = await fetch(
          `/api/pc-builder/parts?${params.toString()}${facetQs ? `&${facetQs}` : ""}`,
        );
        const body = (await response.json()) as PartsResponse;
        if (!response.ok) {
          setError(body.message ?? "Could not load parts");
          setParts([]);
          return;
        }
        const raw = body.data?.items ?? [];
        // Defense in depth: drop any row that slipped past SQL facet equality.
        const filtered = raw.filter((part) =>
          partMatchesCompatibilityFacets(part, compatFacets),
        );
        setParts(filtered);
        setTotalParts(
          filtered.length === raw.length
            ? (body.data?.total ?? filtered.length)
            : filtered.length,
        );
      } catch {
        setError("Network error while loading parts");
        setParts([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      const entries = Object.entries(initialSlugs) as Array<
        [BuilderSlotId, string]
      >;
      if (entries.length === 0) {
        setHydrating(false);
        return;
      }
      const next: BuilderSelection = {};
      for (const [slotId, slug] of entries) {
        try {
          const response = await fetch(`/api/catalogue/products/${slug}`);
          if (!response.ok) continue;
          const body = (await response.json()) as {
            data?: {
              product?: {
                id: string;
                slug: string;
                title: string;
                attributes?: { facets?: Record<string, string> };
                images?: Array<{ url: string }>;
                seller?: { tradeName?: string | null; legalName: string };
                variants?: Array<{
                  id: string;
                  sellingPricePaise: number;
                  mrpPaise: number;
                  inventory?: { onHand: number; reserved: number } | null;
                }>;
              };
            };
          };
          const product = body.data?.product;
          const variant = product?.variants?.[0];
          if (!product || !variant) continue;
          const onHand = variant.inventory?.onHand ?? 0;
          const reserved = variant.inventory?.reserved ?? 0;
          next[slotId] = {
            productId: product.id,
            variantId: variant.id,
            slug: product.slug,
            title: product.title,
            imageUrl: product.images?.[0]?.url ?? null,
            pricePaise: variant.sellingPricePaise,
            mrpPaise: variant.mrpPaise,
            availableQty: Math.max(0, onHand - reserved),
            sellerName:
              product.seller?.tradeName ?? product.seller?.legalName ?? "Seller",
            facets: product.attributes?.facets ?? {},
          };
        } catch {
          /* skip bad slug */
        }
      }
      if (!cancelled) {
        setSelection(next);
        setHydrating(false);
      }
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [initialSlugs]);

  useEffect(() => {
    if (hydrating) return;
    const timer = window.setTimeout(() => {
      void loadParts(activeSlot, query, selection, preset);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [activeSlot, query, selection, loadParts, hydrating, preset]);

  function choosePart(part: BuilderPart) {
    const merged: BuilderSelection = { ...selection, [activeSlot]: part };
    const pruned = pruneIncompatibleSelection(merged, activeSlot);
    setSelection(pruned);
    const nextSlot = nextEmptyBuilderSlot(pruned, activeSlot);
    if (nextSlot && nextSlot !== activeSlot) {
      setActiveSlot(nextSlot);
      setQuery(searchHintForSlot(nextSlot, preset));
    }
  }

  function clearSlot(slotId: BuilderSlotId) {
    setSelection((current) => {
      const next = { ...current };
      delete next[slotId];
      return pruneIncompatibleSelection(next, slotId);
    });
  }

  function openSlot(slotId: BuilderSlotId) {
    setActiveSlot(slotId);
    setQuery(searchHintForSlot(slotId, preset));
  }

  function applyPreset(id: BuilderPresetId) {
    setPreset(id);
    setSelection({});
    setActiveSlot("cpu");
    setQuery(searchHintForSlot("cpu", id));
  }

  async function addBuildToCart() {
    if (!requiredReady || hasBlockingError) return;
    setAdding(true);
    setError(null);
    try {
      for (const slot of BUILDER_SLOTS) {
        const part = selection[slot.id];
        if (!part) continue;
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ variantId: part.variantId, quantity: 1 }),
        });
        if (response.status === 401) {
          router.push(`/login?next=${encodeURIComponent("/pc-builder")}`);
          return;
        }
        if (!response.ok) {
          const body = (await response.json()) as { message?: string };
          setError(body.message ?? `Could not add ${slot.label}`);
          return;
        }
      }
      void import("@/components/toast-host").then(({ showToast }) => {
        showToast("Build added to cart — Express ready");
      });
      router.push("/cart");
      router.refresh();
    } catch {
      setError("Could not add the full build to cart");
    } finally {
      setAdding(false);
    }
  }

  function shareBuild() {
    const qs = buildShareQuery(selection);
    const url = `${window.location.origin}/pc-builder${qs ? `?${qs}` : ""}`;
    void navigator.clipboard?.writeText(url);
    void import("@/components/toast-host").then(({ showToast }) => {
      showToast("Build link copied");
    });
  }

  const visibleSlots = hideEmpty
    ? BUILDER_SLOTS.filter((slot) => selection[slot.id] || slot.required)
    : BUILDER_SLOTS;

  const activeMeta = BUILDER_SLOTS.find((slot) => slot.id === activeSlot)!;
  const activeCompat = compatibilityFacetsForSlot(activeSlot, selection);
  const lockLabels = compatibilityLockLabels(activeSlot, selection);

  return (
    <div className="container-shell py-5 md:py-7">
      <div className="mb-5 flex flex-col gap-3 md:mb-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-[12px] font-semibold tracking-[0.14em] text-muted uppercase">
            Aspera Express
          </p>
          <h1 className="font-display mt-1 text-[28px] leading-tight font-bold tracking-tight md:text-[36px]">
            PC Builder
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted md:text-[15px]">
            Pick compatible parts from live Pune stock. We check socket, RAM, and
            PSU headroom — Express delivery usually within 75–90 minutes in hub
            zones when in stock.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {BUILDER_PRESETS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => applyPreset(entry.id)}
              className={`rounded-[10px] border px-3 py-2 text-[13px] font-semibold transition ${
                preset === entry.id
                  ? "border-foreground bg-foreground text-white"
                  : "border-border bg-white text-foreground hover:border-[#cfd6e0]"
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.7fr)] xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(17rem,0.72fr)]">
        {/* Slot list */}
        <section className="rounded-[12px] border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-[13px] font-semibold text-foreground">
              Components · {configuredCount}/{BUILDER_SLOTS.length}
            </p>
            <button
              type="button"
              className="text-[12px] font-medium text-muted hover:text-foreground"
              onClick={() => setHideEmpty((value) => !value)}
            >
              {hideEmpty ? "Show all slots" : "Hide empty"}
            </button>
          </div>
          <ul className="divide-y divide-border">
            {visibleSlots.map((slot) => {
              const part = selection[slot.id];
              const active = activeSlot === slot.id;
              return (
                <li key={slot.id}>
                  <button
                    type="button"
                    onClick={() => openSlot(slot.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                      active ? "bg-[#f7f8fa]" : "hover:bg-[#fafbfc]"
                    }`}
                  >
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
                      {part?.imageUrl ? (
                        <Image
                          src={part.imageUrl}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-contain p-1"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-muted">
                          {slot.required ? "Req" : "+"}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-foreground">
                          {slot.label}
                        </span>
                        {slot.required ? (
                          <span className="text-[10px] tracking-wide text-muted uppercase">
                            Required
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-muted">
                        {part?.title ?? slot.hint}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      {part ? (
                        <>
                          <span className="block text-[13px] font-semibold">
                            {formatPaiseINR(part.pricePaise)}
                          </span>
                          <button
                            type="button"
                            className="text-[11px] text-muted hover:text-danger"
                            onClick={(event) => {
                              event.stopPropagation();
                              clearSlot(slot.id);
                            }}
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <span className="text-[12px] font-medium text-accent">
                          Choose
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Picker */}
        <section className="rounded-[12px] border border-border bg-white xl:min-h-[36rem]">
          <div className="border-b border-border px-4 py-3">
            <p className="text-[13px] font-semibold text-foreground">
              Choose {activeMeta.label}
            </p>
            <p className="mt-0.5 text-[12px] text-muted">{activeMeta.hint}</p>
            {lockLabels.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {lockLabels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center rounded-md border border-[#c5d4e8] bg-[#eef4fb] px-2 py-1 text-[11px] font-semibold text-[#1e3a5f]"
                  >
                    Compatible · {label}
                  </span>
                ))}
              </div>
            ) : Object.keys(activeCompat).length > 0 ? (
              <p className="mt-2 text-[11px] text-muted">
                Filtered to match your build
              </p>
            ) : null}
            <div className="mt-3">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  lockLabels.length > 0
                    ? `Search compatible ${activeMeta.label.toLowerCase()}…`
                    : `Search ${activeMeta.label.toLowerCase()}…`
                }
                className="w-full rounded-[10px] border border-border bg-white px-3 py-2.5 text-[14px] outline-none focus:border-foreground"
              />
            </div>
          </div>
          <div className="max-h-[32rem] overflow-y-auto p-3">
            {loading ? (
              <p className="px-2 py-8 text-center text-[13px] text-muted">
                Loading live stock…
              </p>
            ) : parts.length === 0 ? (
              <p className="px-2 py-8 text-center text-[13px] text-muted">
                No in-stock parts match these filters. Try clearing a prior part
                or broadening search.
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {parts.map((part) => {
                  const selected =
                    selection[activeSlot]?.variantId === part.variantId;
                  return (
                    <li key={part.variantId}>
                      <button
                        type="button"
                        onClick={() => choosePart(part)}
                        className={`flex h-full w-full gap-3 rounded-[10px] border p-2.5 text-left transition ${
                          selected
                            ? "border-foreground bg-[#f7f8fa]"
                            : "border-border hover:border-[#cfd6e0]"
                        }`}
                      >
                        <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
                          {part.imageUrl ? (
                            <Image
                              src={part.imageUrl}
                              alt=""
                              fill
                              sizes="64px"
                              className="object-contain p-1"
                            />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 text-[12px] leading-snug font-medium text-foreground">
                            {part.title}
                          </span>
                          <span className="mt-1 block text-[13px] font-bold">
                            {formatPaiseINR(part.pricePaise)}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-muted">
                            {part.availableQty > 0
                              ? "In stock · Express"
                              : "Check stock"}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {totalParts > parts.length ? (
              <p className="mt-3 text-center text-[11px] text-muted">
                Showing {parts.length} of {totalParts} matching parts
              </p>
            ) : null}
          </div>
        </section>

        {/* Summary */}
        <aside className="h-fit rounded-[12px] border border-border bg-white lg:sticky lg:top-24">
          <div className="border-b border-border px-4 py-3">
            <p className="text-[13px] font-semibold">Build summary</p>
            <p className="mt-0.5 text-[12px] text-muted">
              Express · usually 75–90 mins in hub zones
            </p>
          </div>
          <div className="space-y-3 px-4 py-4">
            <div>
              <p className="text-[11px] tracking-wide text-muted uppercase">
                Estimated total
              </p>
              <p className="font-display text-[28px] font-bold tracking-tight">
                {formatPaiseINR(totalPaise)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-[10px] border border-border bg-[#fafbfc] p-3 text-[12px]">
              <div>
                <p className="text-muted">Est. draw</p>
                <p className="font-semibold">{power.estimatedDrawW} W</p>
              </div>
              <div>
                <p className="text-muted">PSU target</p>
                <p className="font-semibold">{power.recommendedPsuW} W+</p>
              </div>
            </div>
            <ul className="space-y-1.5">
              {issues.slice(0, 6).map((issue) => (
                <li
                  key={issue.message}
                  className={`rounded-lg px-2.5 py-2 text-[12px] leading-snug ${
                    issue.severity === "error"
                      ? "bg-[#fdecec] text-[#8a1f1f]"
                      : issue.severity === "warn"
                        ? "bg-[#fff4e5] text-[#8a4b10]"
                        : "bg-[#f3f5f8] text-[#334155]"
                  }`}
                >
                  {issue.message}
                </li>
              ))}
            </ul>
            {error ? (
              <p className="text-[12px] text-danger">{error}</p>
            ) : null}
            <button
              type="button"
              disabled={!requiredReady || hasBlockingError || adding}
              onClick={() => void addBuildToCart()}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[10px] bg-[color:var(--brand-accent)] px-4 text-[14px] font-semibold text-[#0B1220] transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding ? "Adding build…" : "Add build to cart"}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={shareBuild}
                className="inline-flex min-h-10 flex-1 items-center justify-center rounded-[10px] border border-border text-[13px] font-medium hover:border-[#cfd6e0]"
              >
                Copy link
              </button>
              <Link
                href="/browse"
                className="inline-flex min-h-10 flex-1 items-center justify-center rounded-[10px] border border-border text-[13px] font-medium hover:border-[#cfd6e0]"
              >
                Browse parts
              </Link>
            </div>
            <p className="text-[11px] leading-relaxed text-muted">
              Better than a basic part list: live Aspera stock, socket/RAM
              checks, wattage guidance, and one-click Express cart.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
