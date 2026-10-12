import "server-only";
import { db } from "@/lib/db";
import {
  SETUP_COMPLEMENTS,
  categoriesForKind,
  kindForCategory,
} from "@/services/compatibility/kinds";
import { isIncompatible, type CompatibilityItem } from "@/services/compatibility/rules";
import type { ProductCardData, ProductDetailData } from "@/types/catalog";
import { productCardInclude, toProductCard } from "./mappers";
import { getProductSpecsMap } from "./products.service";

const RELATED_LIMIT = 8;
const SETUP_PER_KIND = 2;
const CANDIDATES_PER_KIND = 12;

const CART_SUGGESTIONS = 4;

/** "Productos que podrían interesarte" en el carrito: complementos de lo que ya eligió. */
export async function getCartSuggestions(
  items: { productId: string; categorySlug: string }[],
): Promise<ProductCardData[]> {
  const exclude = items.map((i) => i.productId);
  const kinds = new Set(
    items.flatMap((i) => SETUP_COMPLEMENTS[kindForCategory(i.categorySlug) ?? "cable"] ?? []),
  );
  const slugs = [...kinds].flatMap(categoriesForKind);
  const rows = await db.product.findMany({
    where: {
      status: "ACTIVE",
      availableStock: { gt: 0 },
      id: { notIn: exclude },
      ...(slugs.length ? { category: { slug: { in: slugs } } } : {}),
    },
    include: productCardInclude,
    orderBy: { soldCount: "desc" },
    take: CART_SUGGESTIONS,
  });
  return rows.map(toProductCard);
}

/** Misma categoría, priorizando misma marca y precio similar. */
export async function getRelatedProducts(product: ProductDetailData): Promise<ProductCardData[]> {
  const rows = await db.product.findMany({
    where: {
      status: "ACTIVE",
      categoryId: product.category.id,
      id: { not: product.id },
      availableStock: { gt: 0 },
    },
    include: productCardInclude,
    orderBy: { soldCount: "desc" },
    take: RELATED_LIMIT * 2,
  });
  return rows
    .map(toProductCard)
    .sort((a, b) => Math.abs(a.price - product.price) - Math.abs(b.price - product.price))
    .slice(0, RELATED_LIMIT);
}

/**
 * "Completá tu setup": productos de categorías complementarias,
 * descartando los que el motor de compatibilidad marca como incompatibles.
 */
export async function getSetupRecommendations(
  product: ProductDetailData,
): Promise<ProductCardData[]> {
  const kind = kindForCategory(product.category.slug);
  if (!kind) return [];

  const source: CompatibilityItem = {
    kind,
    name: product.name,
    specs: Object.fromEntries(product.specifications.map((s) => [s.key, s.value])),
  };

  // Las categorías complementarias se consultan en paralelo (antes eran 8
  // round-trips secuenciales para una placa de video, frenando el TTFB de la ficha).
  const batches = await Promise.all(
    SETUP_COMPLEMENTS[kind].map(async (complement) => {
      const slugs = categoriesForKind(complement);
      const rows = await db.product.findMany({
        where: { status: "ACTIVE", availableStock: { gt: 0 }, category: { slug: { in: slugs } } },
        include: productCardInclude,
        orderBy: { soldCount: "desc" },
        take: CANDIDATES_PER_KIND,
      });
      const specs = await getProductSpecsMap(rows.map((r) => r.id));
      const compatible = rows.filter(
        (r) =>
          !isIncompatible(source, { kind: complement, name: r.name, specs: specs.get(r.id) ?? {} }),
      );
      return compatible.slice(0, SETUP_PER_KIND).map(toProductCard);
    }),
  );
  return batches.flat();
}
