import type { Prisma } from "@prisma/client";
import { stockLevel } from "@/services/inventory/rules";
import type { ProductCardData } from "@/types/catalog";

export const productCardInclude = {
  brand: { select: { name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
  inventory: { select: { minStock: true } },
} satisfies Prisma.ProductInclude;

export type ProductCardRow = Prisma.ProductGetPayload<{ include: typeof productCardInclude }>;

export function minStockOf(inventory: { minStock: number }[]): number {
  return inventory.reduce((max, i) => Math.max(max, i.minStock), 0);
}

export function toProductCard(row: ProductCardRow): ProductCardData {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    brand: row.brand,
    category: row.category,
    price: row.price,
    compareAtPrice: row.compareAtPrice,
    image: row.images[0] ?? null,
    ratingAvg: row.ratingAvg,
    ratingCount: row.ratingCount,
    available: row.availableStock,
    stockLevel: stockLevel(row.availableStock, minStockOf(row.inventory)),
    warrantyMonths: row.warrantyMonths,
    createdAt: row.createdAt.toISOString(),
    weightGrams: row.weightGrams,
  };
}
