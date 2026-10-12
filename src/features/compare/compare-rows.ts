import type { CompareProduct, CompareRow } from "@/types/compare";

/** Une las especificaciones de todos los productos y marca las filas con diferencias. */
export function buildCompareRows(products: CompareProduct[]): CompareRow[] {
  const labels = new Map<string, string>();
  for (const p of products)
    for (const s of p.specifications) if (!labels.has(s.key)) labels.set(s.key, s.label);
  return [...labels.entries()].map(([key, label]) => {
    const values = products.map((p) => p.specifications.find((s) => s.key === key)?.value ?? null);
    const distinct = new Set(values.map((v) => v?.toLowerCase() ?? "-"));
    return { key, label, values, different: distinct.size > 1 };
  });
}

/** Índice del menor precio (para resaltarlo). */
export function cheapestIndex(products: CompareProduct[]): number {
  let best = -1;
  products.forEach((p, i) => {
    if (best === -1 || p.price < products[best]!.price) best = i;
  });
  return best;
}
