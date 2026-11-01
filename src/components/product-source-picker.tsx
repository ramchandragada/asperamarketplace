"use client";

import { useEffect, useMemo, useState } from "react";

type TreeChild = {
  id: string;
  slug: string;
  name: string;
  productCount: number;
};

type TreeCategory = {
  id: string;
  key: string;
  name: string;
  slug: string;
  children: TreeChild[];
};

type BrandOption = {
  id?: string;
  slug: string;
  name: string;
  productCount: number;
};

type VariantOption = {
  id: string;
  sku: string;
  title: string;
  mrpPaise: number;
  sellingPricePaise: number;
};

type ProductOption = {
  id: string;
  slug: string;
  title: string;
  brandName: string | null;
  imageUrl: string | null;
  variants: VariantOption[];
};

export type CataloguePickSelection = {
  sourceProductId: string;
  catalogueSku: string;
  variantTitle: string;
  mrpPaise: number;
  sellingPricePaise: number;
};

/**
 * Closed-catalogue cascade: Category → Sub-category → Brand → Product → SKU.
 * Writes sourceProductId into a hidden input for the offer form.
 */
export function ProductSourcePicker({
  name = "sourceProductId",
  required = true,
  onSelect,
}: {
  name?: string;
  required?: boolean;
  onSelect?: (selection: CataloguePickSelection | null) => void;
}) {
  const [tree, setTree] = useState<TreeCategory[]>([]);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [groupKey, setGroupKey] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [brandSlug, setBrandSlug] = useState("");
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/catalogue/pick");
        const body = (await response.json()) as {
          data?: { categories?: TreeCategory[] };
          message?: string;
        };
        if (!response.ok) {
          if (!cancelled) {
            setTreeError(body.message ?? "Could not load categories");
          }
          return;
        }
        if (!cancelled) {
          setTree(body.data?.categories ?? []);
          setTreeError(null);
        }
      } catch {
        if (!cancelled) setTreeError("Could not load categories");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedGroup = useMemo(
    () => tree.find((row) => row.key === groupKey) ?? null,
    [tree, groupKey],
  );
  const subcategories = selectedGroup?.children ?? [];
  const selectedProduct = useMemo(
    () => products.find((row) => row.id === productId) ?? null,
    [products, productId],
  );
  const variants = selectedProduct?.variants ?? [];
  const selectedVariant = useMemo(
    () => variants.find((row) => row.id === variantId) ?? null,
    [variants, variantId],
  );

  useEffect(() => {
    if (!categorySlug) {
      setBrands([]);
      return;
    }
    let cancelled = false;
    setLoadingBrands(true);
    void (async () => {
      try {
        const params = new URLSearchParams({ categorySlug });
        const response = await fetch(`/api/catalogue/pick?${params}`);
        const body = (await response.json()) as {
          data?: { brands?: BrandOption[] };
        };
        if (!cancelled) {
          setBrands(body.data?.brands ?? []);
        }
      } finally {
        if (!cancelled) setLoadingBrands(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categorySlug]);

  useEffect(() => {
    if (!categorySlug || !brandSlug) {
      setProducts([]);
      return;
    }
    let cancelled = false;
    setLoadingProducts(true);
    void (async () => {
      try {
        const params = new URLSearchParams({ categorySlug, brandSlug });
        const response = await fetch(`/api/catalogue/pick?${params}`);
        const body = (await response.json()) as {
          data?: { products?: ProductOption[] };
        };
        if (!cancelled) {
          setProducts(body.data?.products ?? []);
        }
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categorySlug, brandSlug]);

  useEffect(() => {
    if (!selectedProduct) {
      setVariantId("");
      onSelect?.(null);
      return;
    }
    if (selectedProduct.variants.length === 1) {
      const only = selectedProduct.variants[0]!;
      setVariantId(only.id);
      onSelect?.({
        sourceProductId: selectedProduct.id,
        catalogueSku: only.sku,
        variantTitle: only.title,
        mrpPaise: only.mrpPaise,
        sellingPricePaise: only.sellingPricePaise,
      });
      return;
    }
    const variant = selectedProduct.variants.find((row) => row.id === variantId);
    if (!variant) {
      setVariantId("");
      onSelect?.(null);
      return;
    }
    onSelect?.({
      sourceProductId: selectedProduct.id,
      catalogueSku: variant.sku,
      variantTitle: variant.title,
      mrpPaise: variant.mrpPaise,
      sellingPricePaise: variant.sellingPricePaise,
    });
    // onSelect identity is unstable from parents; selection fields are the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct, variantId]);

  const selectClass =
    "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2";

  return (
    <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
      <input
        type="hidden"
        name={name}
        value={selectedVariant ? productId : ""}
        required={required}
      />

      {treeError ? (
        <p className="sm:col-span-2 text-sm text-danger">{treeError}</p>
      ) : null}

      <label className="text-sm">
        Category
        <select
          required={required}
          value={groupKey}
          className={selectClass}
          onChange={(event) => {
            setGroupKey(event.target.value);
            setCategorySlug("");
            setBrandSlug("");
            setProductId("");
            setVariantId("");
            setProducts([]);
            setBrands([]);
          }}
        >
          <option value="">Select category</option>
          {tree.map((group) => (
            <option key={group.key} value={group.key}>
              {group.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        Sub category
        <select
          required={required}
          value={categorySlug}
          disabled={!groupKey}
          className={selectClass}
          onChange={(event) => {
            setCategorySlug(event.target.value);
            setBrandSlug("");
            setProductId("");
            setVariantId("");
            setProducts([]);
          }}
        >
          <option value="">Select sub category</option>
          {subcategories.map((child) => (
            <option key={child.id} value={child.slug}>
              {child.name}
              {child.productCount > 0 ? ` (${child.productCount})` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        Brand
        <select
          required={required}
          value={brandSlug}
          disabled={!categorySlug || loadingBrands}
          className={selectClass}
          onChange={(event) => {
            setBrandSlug(event.target.value);
            setProductId("");
            setVariantId("");
          }}
        >
          <option value="">
            {loadingBrands ? "Loading brands…" : "Select brand"}
          </option>
          {brands.map((brand) => (
            <option key={brand.slug} value={brand.slug}>
              {brand.name}
              {brand.productCount > 0 ? ` (${brand.productCount})` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        Product
        <select
          required={required}
          value={productId}
          disabled={!brandSlug || loadingProducts}
          className={selectClass}
          onChange={(event) => {
            setProductId(event.target.value);
            setVariantId("");
          }}
        >
          <option value="">
            {loadingProducts ? "Loading products…" : "Select product"}
          </option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.title}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm sm:col-span-2">
        Product (SKU)
        <select
          required={required}
          value={variantId}
          disabled={!productId || variants.length === 0}
          className={selectClass}
          onChange={(event) => setVariantId(event.target.value)}
        >
          <option value="">Select SKU</option>
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.sku}
              {variant.title && variant.title !== "Default"
                ? ` — ${variant.title}`
                : ""}
            </option>
          ))}
        </select>
      </label>

      {selectedProduct && selectedVariant ? (
        <div className="sm:col-span-2 flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-sm">
          {selectedProduct.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedProduct.imageUrl}
              alt=""
              className="h-14 w-14 rounded object-cover"
            />
          ) : (
            <div className="h-14 w-14 rounded bg-border" />
          )}
          <div className="min-w-0">
            <p className="truncate font-medium">{selectedProduct.title}</p>
            <p className="truncate text-xs text-muted">
              {[selectedProduct.brandName, selectedVariant.sku]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
