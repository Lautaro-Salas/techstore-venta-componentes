import "server-only";
import { cache } from "react";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { MIN_QUERY_LENGTH, sanitizeQuery, suggestCorrection } from "./rules";

const MAX_SEARCH_RESULTS = 500;
const VOCABULARY_TTL_MS = 5 * 60_000;

/**
 * Busca productos activos por nombre, SKU, marca o categoría.
 * Cada palabra del término debe aparecer en alguno de esos campos (búsqueda por tokens),
 * y la tolerancia a tipeo la aporta didYouMean(). Devuelve IDs ordenados por relevancia.
 * Memoizada: listProducts() y getCatalogFacets() la llaman con el mismo término en el mismo request.
 */
export const searchProductIds = cache(async (rawQuery: string): Promise<string[]> => {
  const q = sanitizeQuery(rawQuery);
  if (q.length < MIN_QUERY_LENGTH) return [];
  // sanitizeQuery ya eliminó % y _ (comodines de LIKE).
  const words = q.split(" ").filter(Boolean);
  if (words.length === 0) return [];

  const wordMatches = Prisma.join(
    words.map((w) => {
      const like = `%${w}%`;
      return Prisma.sql`(lower(p.name) LIKE ${like} OR lower(p.sku) LIKE ${like} OR lower(b.name) LIKE ${like} OR lower(c.name) LIKE ${like})`;
    }),
    " AND ",
  );
  const phrase = `%${q}%`;

  const rows = await db.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT p.id
    FROM "Product" p
    JOIN "Brand" b ON b.id = p."brandId"
    JOIN "Category" c ON c.id = p."categoryId"
    WHERE p.status = 'ACTIVE' AND ${wordMatches}
    ORDER BY
      CASE WHEN lower(p.sku) = ${q} THEN 0 ELSE 1 END,
      CASE WHEN lower(p.name) LIKE ${phrase} THEN 0 ELSE 1 END,
      p."soldCount" DESC
    LIMIT ${MAX_SEARCH_RESULTS}
  `);
  return rows.map((r) => r.id);
});

let vocabularyCache: { terms: string[]; expiresAt: number } | null = null;

async function getVocabulary(): Promise<string[]> {
  if (vocabularyCache && vocabularyCache.expiresAt > Date.now()) return vocabularyCache.terms;
  const [brands, categories, products] = await Promise.all([
    db.brand.findMany({ select: { name: true } }),
    db.category.findMany({ where: { isActive: true }, select: { name: true } }),
    db.product.findMany({ where: { status: "ACTIVE" }, select: { name: true } }),
  ]);
  const terms = [...brands, ...categories, ...products].map((r) => r.name);
  vocabularyCache = { terms, expiresAt: Date.now() + VOCABULARY_TTL_MS };
  return terms;
}

export async function didYouMean(rawQuery: string): Promise<string | null> {
  const q = sanitizeQuery(rawQuery);
  if (q.length < MIN_QUERY_LENGTH) return null;
  return suggestCorrection(q, await getVocabulary());
}
