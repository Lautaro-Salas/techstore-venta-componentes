import "server-only";
import { getProductSpecsMap } from "@/services/catalog/products.service";
import type { CartLineView } from "@/types/cart";
import { kindForCategory } from "./kinds";
import { checkPair, type CompatibilityItem } from "./rules";

export interface CompatibilityWarning {
  products: [string, string];
  message: string;
}

/** Revisa todos los pares de productos del carrito y devuelve incompatibilidades detectadas. */
export async function findCartIncompatibilities(lines: CartLineView[]): Promise<CompatibilityWarning[]> {
  const candidates = lines.filter((l) => kindForCategory(l.product.category.slug));
  if (candidates.length < 2) return [];
  const specs = await getProductSpecsMap(candidates.map((l) => l.productId));
  const items: CompatibilityItem[] = candidates.map((l) => ({
    kind: kindForCategory(l.product.category.slug)!,
    name: l.product.name,
    specs: specs.get(l.productId) ?? {},
  }));
  const warnings: CompatibilityWarning[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      for (const result of checkPair(items[i]!, items[j]!)) {
        if (result.status === "incompatible") {
          warnings.push({ products: [items[i]!.name, items[j]!.name], message: result.message });
        }
      }
    }
  }
  return warnings;
}
