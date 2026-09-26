import type { MetadataRoute } from "next";
import { prisma } from "@/platform/db/prisma";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://asperamarketplace.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/browse",
    "/shop",
    "/popular",
    "/sell",
    "/about",
    "/help",
    "/support",
    "/privacy",
    "/returns",
    "/shipping",
    "/seller-policies",
    "/careers",
    "/press",
    "/cart",
    "/login",
    "/register",
  ].map((path) => ({
    url: `${siteUrl}${path || "/"}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const [products, categories, sellers] = await Promise.all([
    prisma.product.findMany({
      where: { status: "approved" },
      select: { slug: true, updatedAt: true },
      take: 5000,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.seller.findMany({
      where: { status: "approved" },
      select: { tradeName: true, legalName: true, updatedAt: true },
      take: 500,
    }),
  ]);

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/products/${encodeURIComponent(product.slug)}`,
    lastModified: product.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${siteUrl}/browse?categorySlug=${encodeURIComponent(category.slug)}`,
    lastModified: category.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const sellerEntries: MetadataRoute.Sitemap = sellers.map((seller) => {
    const name = seller.tradeName ?? seller.legalName;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
    return {
      url: `${siteUrl}/shops/${encodeURIComponent(slug)}`,
      lastModified: seller.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    };
  });

  return [...staticRoutes, ...productEntries, ...categoryEntries, ...sellerEntries];
}
