import "server-only";
import type { ProductCardData } from "@/types/catalog";
import { productCardInclude, toProductCard } from "./mappers";
import { categoryBreadcrumbs, findCategoryById } from "./categories.service";
import { parseTags } from "@/lib/tags";
import { searchProductIds } from "@/services/search/search.service";
import type { CatalogFilters, Paginated, ProductDetailData, SortOption } from "@/types/catalog";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";


export const CATALOG_PAGE_SIZE = 24;
const HOME_SECTION_SIZE = 8;
const NEW_ARRIVAL_DAYS = 45;
const DAY_MS = 86_400_000;

const ACTIVE: Prisma.ProductWhereInput = { status: "ACTIVE" };

export function buildProductWhere(
  filters: CatalogFilters,
  searchIds?: string[],
): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [ACTIVE];
  if (searchIds) and.push({ id: { in: searchIds } });
  if (filters.categoryIds?.length) and.push({ categoryId: { in: filters.categoryIds } });
  if (filters.brandSlugs?.length) and.push({ brand: { slug: { in: filters.brandSlugs } } });
  if (filters.minPrice !== undefined) and.push({ price: { gte: filters.minPrice } });
  if (filters.maxPrice !== undefined) and.push({ price: { lte: filters.maxPrice } });
  if (filters.inStock) and.push({ availableStock: { gt: 0 } });
  if (filters.onSale) and.push({ compareAtPrice: { not: null } });
  for (const [key, values] of Object.entries(filters.specs ?? {})) {
    if (values.length) and.push({ specifications: { some: { key, value: { in: values } } } });
  }
  return { AND: and };
}

function orderBy(sort: SortOption | undefined): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ price: "asc" }];
    case "price_desc":
      return [{ price: "desc" }];
    case "newest":
      return [{ createdAt: "desc" }];
    case "rating":
      return [{ ratingAvg: "desc" }, { ratingCount: "desc" }];
    case "best_selling":
    case "relevance":
    default:
      return [{ availableStock: "desc" }, { soldCount: "desc" }, { createdAt: "desc" }];
  }
}

export async function listProducts(filters: CatalogFilters): Promise<Paginated<ProductCardData>> {
  const page = Math.max(filters.page ?? 1, 1);
  const searchIds = filters.q ? await searchProductIds(filters.q) : undefined;
  const where = buildProductWhere(filters, searchIds);
  const useRelevance = Boolean(searchIds) && (!filters.sort || filters.sort === "relevance");

  // Relevancia: primero se rankean sólo los IDs (query liviana) y después se
  // traen con include únicamente las 24 filas de la página. Antes se traían
  // hasta 500 productos con 5 tablas relacionadas para paginar en JS.
  const [total, pageRows] = await Promise.all([
    db.product.count({ where }),
    useRelevance
      ? (async () => {
          const matched = await db.product.findMany({ where, select: { id: true } });
          const rank = new Map((searchIds ?? []).map((id, i) => [id, i]));
          const pageIds = matched
            .map((r) => r.id)
            .sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0))
            .slice((page - 1) * CATALOG_PAGE_SIZE, page * CATALOG_PAGE_SIZE);
          if (pageIds.length === 0) return [];
          const pageRowsQuery = await db.product.findMany({
            where: { AND: [where, { id: { in: pageIds } }] },
            include: productCardInclude,
          });
          const order = new Map(pageIds.map((id, i) => [id, i]));
          return pageRowsQuery.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
        })()
      : db.product.findMany({
          where,
          include: productCardInclude,
          orderBy: orderBy(filters.sort),
          skip: (page - 1) * CATALOG_PAGE_SIZE,
          take: CATALOG_PAGE_SIZE,
        }),
  ]);

  return {
    items: pageRows.map(toProductCard),
    total,
    page,
    pageSize: CATALOG_PAGE_SIZE,
    totalPages: Math.max(Math.ceil(total / CATALOG_PAGE_SIZE), 1),
  };
}

export async function getProductsByIds(ids: string[]): Promise<ProductCardData[]> {
  if (ids.length === 0) return [];
  const rows = await db.product.findMany({
    where: { ...ACTIVE, id: { in: ids } },
    include: productCardInclude,
  });
  const order = new Map(ids.map((id, i) => [id, i]));
  return rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)).map(toProductCard);
}

export async function getHomeSections(): Promise<{
  offers: ProductCardData[];
  bestSellers: ProductCardData[];
  newArrivals: ProductCardData[];
}> {
  const inStock: Prisma.ProductWhereInput = { ...ACTIVE, availableStock: { gt: 0 } };
  const [offers, bestSellers, newArrivals] = await Promise.all([
    db.product.findMany({
      where: { ...inStock, compareAtPrice: { not: null } },
      include: productCardInclude,
      orderBy: [{ isFeatured: "desc" }, { soldCount: "desc" }],
      take: HOME_SECTION_SIZE,
    }),
    db.product.findMany({
      where: inStock,
      include: productCardInclude,
      orderBy: { soldCount: "desc" },
      take: HOME_SECTION_SIZE,
    }),
    db.product.findMany({
      where: { ...inStock, createdAt: { gte: new Date(Date.now() - NEW_ARRIVAL_DAYS * DAY_MS) } },
      include: productCardInclude,
      orderBy: { createdAt: "desc" },
      take: HOME_SECTION_SIZE,
    }),
  ]);
  return {
    offers: offers.map(toProductCard),
    bestSellers: bestSellers.map(toProductCard),
    newArrivals: newArrivals.map(toProductCard),
  };
}

/** Memoizada: generateMetadata y el page comparten una sola query por request. */
export const getProductBySlug = async (slug: string): Promise<ProductDetailData | null> => {
  const row = await db.product.findFirst({
    where: { ...ACTIVE, slug },
    include: {
      ...productCardInclude,
      images: { orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
      specifications: {
        orderBy: { sortOrder: "asc" },
        select: { group: true, key: true, label: true, value: true },
      },
    },
  });
  if (!row) return null;
  const located = await findCategoryById(row.categoryId);
  const card = toProductCard({ ...row, images: row.images.slice(0, 1) });
  const hasDimensions = row.lengthMm && row.widthMm && row.heightMm;
  return {
    ...card,
    shortDescription: row.shortDescription,
    description: row.description,
    images: row.images,
    specifications: row.specifications,
    tags: parseTags(row.tags),
    dimensions: hasDimensions
      ? { lengthMm: row.lengthMm!, widthMm: row.widthMm!, heightMm: row.heightMm! }
      : null,
    breadcrumbs: [
      ...categoryBreadcrumbs(located?.trail ?? []),
      { name: row.name, href: `/producto/${row.slug}` },
    ],
  };
};

export async function getProductSpecsMap(
  ids: string[],
): Promise<Map<string, Record<string, string>>> {
  const specs = await db.productSpecification.findMany({
    where: { productId: { in: ids } },
    select: { productId: true, key: true, value: true },
  });
  const map = new Map<string, Record<string, string>>();
  for (const s of specs) {
    const entry = map.get(s.productId) ?? {};
    entry[s.key] = s.value;
    map.set(s.productId, entry);
  }
  return map;
}
