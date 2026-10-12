import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { searchProductIds } from "@/services/search/search.service";
import type { CatalogFacets, CatalogFilters } from "@/types/catalog";
import { buildProductWhere } from "./products.service";

const MAX_OPTIONS_PER_FACET = 12;

/**
 * Facetas del listado. Se calculan sobre la categoría/búsqueda base
 * (sin aplicar marca/specs/precio) para que el usuario pueda combinar filtros.
 */
export async function getCatalogFacets(filters: CatalogFilters): Promise<CatalogFacets> {
  const searchIds = filters.q ? await searchProductIds(filters.q) : undefined;
  const base: Prisma.ProductWhereInput = buildProductWhere(
    { categoryIds: filters.categoryIds, onSale: filters.onSale },
    searchIds,
  );

  const [brandGroups, priceAgg, specRows] = await Promise.all([
    db.product.groupBy({ by: ["brandId"], where: base, _count: { _all: true } }),
    db.product.aggregate({ where: base, _min: { price: true }, _max: { price: true } }),
    db.productSpecification.groupBy({
      by: ["key", "label", "value"],
      where: { filterable: true, product: base },
      _count: { _all: true },
      orderBy: [{ key: "asc" }, { value: "asc" }],
    }),
  ]);

  const brands = await db.brand.findMany({
    where: { id: { in: brandGroups.map((g) => g.brandId) } },
    select: { id: true, name: true, slug: true },
  });
  const brandCount = new Map(brandGroups.map((g) => [g.brandId, g._count._all]));

  const specMap = new Map<string, CatalogFacets["specs"][number]>();
  for (const row of specRows) {
    const facet = specMap.get(row.key) ?? { key: row.key, label: row.label, options: [] };
    if (facet.options.length < MAX_OPTIONS_PER_FACET) {
      facet.options.push({ value: row.value, label: row.value, count: row._count._all });
    }
    specMap.set(row.key, facet);
  }

  return {
    brands: brands
      .map((b) => ({ value: b.slug, label: b.name, count: brandCount.get(b.id) ?? 0 }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    specs: [...specMap.values()].filter((f) => f.options.length > 1),
    priceRange: { min: priceAgg._min.price ?? 0, max: priceAgg._max.price ?? 0 },
  };
}
