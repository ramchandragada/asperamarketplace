"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { discountPercent, formatPaise } from "@/modules/catalogue/helpers";

type VariantView = {
  id: string;
  title: string;
  sku: string;
  mrpPaise: number;
  sellingPricePaise: number;
  availableQty: number;
  optionValues?: Record<string, string> | null;
};

export function ProductPurchasePanel({
  variants,
  highlights,
  productTitle,
}: {
  variants: VariantView[];
  highlights: Array<{ label: string; value: string }>;
  productTitle?: string;
}) {
  const sizeVariants = useMemo(() => {
    return variants.filter((variant) => {
      const opts = variant.optionValues ?? {};
      return (
        Boolean(opts.size || opts.Size) ||
        /^(xs|s|m|l|xl|xxl|standard)$/i.test(variant.title)
      );
    });
  }, [variants]);

  const requiresSize = sizeVariants.length > 1;
  const [selectedId, setSelectedId] = useState(
    requiresSize ? "" : (variants[0]?.id ?? ""),
  );
  const [sizeChosen, setSizeChosen] = useState(!requiresSize);
  const [pincode, setPincode] = useState("");
  const [deliveryNote, setDeliveryNote] = useState<string | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [buyPending, setBuyPending] = useState(false);
  const router = useRouter();

  function variantColor(variant: VariantView) {
    return variant.optionValues?.color ?? variant.optionValues?.Color ?? null;
  }
  function variantSize(variant: VariantView) {
    return variant.optionValues?.size ?? variant.optionValues?.Size ?? null;
  }

  const selected =
    variants.find((variant) => variant.id === selectedId) ??
    (requiresSize ? undefined : variants[0]);
  const priceVariant = selected ?? variants[0];

  const colorOptions = useMemo(() => {
    const colors = new Set<string>();
    for (const variant of variants) {
      const color =
        variant.optionValues?.color ?? variant.optionValues?.Color ?? null;
      if (color) colors.add(color);
    }
    return [...colors];
  }, [variants]);

  function selectColor(color: string) {
    const size = selected ? variantSize(selected) : null;
    const match =
      variants.find(
        (variant) =>
          variantColor(variant) === color &&
          (size == null || variantSize(variant) === size),
      ) ?? variants.find((variant) => variantColor(variant) === color);
    if (!match) return;
    setSelectedId(match.id);
    if (!requiresSize) setSizeChosen(true);
  }

  const selectionRequired = Boolean(priceVariant) && requiresSize && !sizeChosen;
  const activeVariantId = selected?.id ?? priceVariant?.id ?? "";

  async function buyNow() {
    if (selectionRequired || !activeVariantId) return;
    setBuyPending(true);
    setBuyError(null);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ variantId: activeVariantId, quantity: 1 }),
      });
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent("/checkout")}`);
        return;
      }
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setBuyError(body?.message ?? "Could not start checkout");
        return;
      }
      router.push("/checkout");
      router.refresh();
    } catch {
      setBuyError("Could not reach the cart service. Try again.");
    } finally {
      setBuyPending(false);
    }
  }

  function checkDelivery() {
    const clean = pincode.replace(/\D/g, "");
    if (clean.length !== 6) {
      setDeliveryNote("Enter a valid 6-digit pincode");
      return;
    }
    const day = new Date();
    day.setDate(day.getDate() + 3 + (Number(clean) % 3));
    const label = day.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    setDeliveryNote(
      `Delivery by ${label} · Cash on Delivery available · 7 Day Easy Returns`,
    );
  }

  if (!priceVariant) {
    return <p className="text-sm text-muted">No active variants.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-3xl font-bold tracking-tight md:text-4xl">
            {formatPaise(priceVariant.sellingPricePaise)}
          </span>
          {priceVariant.mrpPaise > priceVariant.sellingPricePaise ? (
            <span className="text-base font-normal text-muted line-through">
              {formatPaise(priceVariant.mrpPaise)}
            </span>
          ) : null}
          {discountPercent(
            priceVariant.mrpPaise,
            priceVariant.sellingPricePaise,
          ) ? (
            <span className="offer-chip px-2 py-1 text-xs">
              {discountPercent(
                priceVariant.mrpPaise,
                priceVariant.sellingPricePaise,
              )}
              % off
            </span>
          ) : null}
        </p>
        <p className="mt-1 text-sm text-muted">Inclusive of taxes</p>
      </div>

      {colorOptions.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-semibold">
            Select colour
            {selected?.optionValues?.color || selected?.optionValues?.Color
              ? `: ${selected.optionValues.color ?? selected.optionValues.Color}`
              : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((color) => {
              const active = variantColor(selected ?? priceVariant) === color;
              return (
              <button
                key={color}
                type="button"
                title={color}
                onClick={() => selectColor(color)}
                className={`h-9 w-9 rounded-full border-2 shadow-sm ${
                  active
                    ? "border-accent ring-2 ring-accent/30"
                    : "border-border hover:border-accent"
                }`}
                style={{ backgroundColor: colorToCss(color) }}
                aria-label={color}
                aria-pressed={active}
              />
              );
            })}
          </div>
        </div>
      ) : null}

      {sizeVariants.length > 1 ? (
        <div id="size-chart">
          <p className="mb-2 text-sm font-semibold">
            Select size
            {selectionRequired ? (
              <span className="ml-1 font-normal text-muted">(required)</span>
            ) : null}
          </p>
          <div className="flex flex-wrap gap-2">
            {sizeVariants.map((variant) => {
              const size =
                variant.optionValues?.size ??
                variant.optionValues?.Size ??
                variant.title;
              const active = sizeChosen && variant.id === selected?.id;
              const soldOut = variant.availableQty <= 0;
              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={soldOut}
                  onClick={() => {
                    setSelectedId(variant.id);
                    setSizeChosen(true);
                  }}
                  className={`min-w-[2.75rem] rounded-[var(--radius-sm)] border px-3 py-2 text-sm font-medium ${
                    active
                      ? "border-accent bg-accent-soft font-semibold text-accent"
                      : soldOut
                        ? "cursor-not-allowed border-border text-muted line-through opacity-60"
                        : "border-border hover:border-accent"
                  }`}
                  aria-pressed={active}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      ) : variants.length > 1 ? (
        <div>
          <p className="mb-2 text-sm font-semibold">Select option</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const active = variant.id === selected?.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(variant.id);
                    setSizeChosen(true);
                  }}
                  className={`rounded-[var(--radius-sm)] border px-3 py-2 text-sm ${
                    active
                      ? "border-accent bg-accent-soft font-semibold text-accent"
                      : "border-border hover:border-accent"
                  }`}
                  aria-pressed={active}
                >
                  {variant.title}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {highlights.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-semibold">Product highlights</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {highlights.map((row) => (
              <div key={row.label} className="contents">
                <dt className="text-muted">{row.label}</dt>
                <dd className="font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      <div className="rounded-[var(--radius)] border border-border bg-surface p-4">
        <p className="text-sm font-semibold">Delivery & services</p>
        <div className="mt-2 flex gap-2">
          <input
            value={pincode}
            onChange={(event) => setPincode(event.target.value)}
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter pincode"
            className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm"
            aria-label="Pincode"
          />
          <button
            type="button"
            onClick={checkDelivery}
            className="rounded-[var(--radius-sm)] bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground"
          >
            Check
          </button>
        </div>
        {deliveryNote ? (
          <p className="mt-2 text-sm text-muted">{deliveryNote}</p>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Free Delivery on eligible orders · Cash on Delivery available
          </p>
        )}
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-border pt-3 text-[11px] text-muted">
          <li className="inline-flex items-center gap-1">
            <span className="font-semibold text-success">✓</span> 7 Days Return
          </li>
          <li className="inline-flex items-center gap-1">
            <span className="font-semibold text-success">✓</span> COD Available
          </li>
          <li className="inline-flex items-center gap-1">
            <span className="font-semibold text-success">✓</span> Fast Delivery
          </li>
        </ul>
        {sizeVariants.length > 1 ? (
          <a
            href="#size-chart"
            className="mt-2 inline-block text-xs font-semibold text-accent hover:underline"
          >
            Size Chart →
          </a>
        ) : null}
      </div>

      {/* Single CTA instance: sticky on mobile, inline on desktop */}
      <div className="fixed inset-x-3 bottom-[calc(5.35rem+env(safe-area-inset-bottom))] z-50 flex gap-2 rounded-2xl border border-border bg-surface/95 p-2 shadow-[var(--shadow-mega)] backdrop-blur-md md:static md:inset-auto md:bottom-auto md:z-auto md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none">
        <div className="min-w-0 flex-1 sm:flex-none">
          <AddToCartButton
            variantId={activeVariantId}
            availableQty={selected?.availableQty ?? priceVariant.availableQty}
            productTitle={productTitle}
            selectionRequired={selectionRequired}
            selectionHint="Please select a size before adding to cart"
          />
        </div>
        {selectionRequired ? (
          <button
            type="button"
            disabled
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-white opacity-60 sm:flex-none"
          >
            Buy now
          </button>
        ) : (
          <button
            type="button"
            disabled={buyPending}
            onClick={() => void buyNow()}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:flex-none"
          >
            {buyPending ? "Starting…" : "Buy now"}
          </button>
        )}
      </div>
      {buyError ? (
        <p className="text-sm text-red-700" role="alert">
          {buyError}
        </p>
      ) : null}
      {/* Spacer so the fixed bar sits above the mobile tab nav */}
      <div className="h-40 md:hidden" aria-hidden />
    </div>
  );
}

function colorToCss(name: string) {
  const key = name.toLowerCase();
  const map: Record<string, string> = {
    red: "#c62828",
    green: "#2e7d32",
    blue: "#1565c0",
    black: "#212121",
    white: "#f5f5f5",
    beige: "#d7ccc8",
    navy: "#1a237e",
    pink: "#ec407a",
    yellow: "#fbc02d",
    grey: "#9e9e9e",
    gray: "#9e9e9e",
    brown: "#6d4c41",
    orange: "#ef6c00",
  };
  return map[key] ?? "#90a4ae";
}
