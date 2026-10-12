"use client";

import { useCallback } from "react";
import { useStoredList } from "@/hooks/use-stored-list";

export const COMPARE_STORAGE_KEY = "ts_compare";
export const MAX_COMPARE_ITEMS = 4;
const SEPARATOR = "|";

/** Cada entrada guarda "productId|categoryId" para exigir misma categoría. */
export function useCompare() {
  const [entries, setEntries] = useStoredList(COMPARE_STORAGE_KEY);
  const parsed = entries.map((e) => {
    const [productId = "", categoryId = ""] = e.split(SEPARATOR);
    return { productId, categoryId };
  });

  const has = useCallback((productId: string) => parsed.some((p) => p.productId === productId), [parsed]);

  /** Devuelve un mensaje de error si no se pudo agregar. */
  const toggle = useCallback(
    (productId: string, categoryId: string): { added: boolean; error?: string } => {
      if (parsed.some((p) => p.productId === productId)) {
        setEntries((list) => list.filter((e) => !e.startsWith(`${productId}${SEPARATOR}`)));
        return { added: false };
      }
      if (parsed.length > 0 && parsed[0]!.categoryId !== categoryId) {
        return { added: false, error: "Solo podés comparar productos de la misma categoría." };
      }
      if (parsed.length >= MAX_COMPARE_ITEMS) {
        return { added: false, error: `Podés comparar hasta ${MAX_COMPARE_ITEMS} productos.` };
      }
      setEntries((list) => [...list, `${productId}${SEPARATOR}${categoryId}`]);
      return { added: true };
    },
    [parsed, setEntries],
  );

  const remove = useCallback(
    (productId: string) => setEntries((list) => list.filter((e) => !e.startsWith(`${productId}${SEPARATOR}`))),
    [setEntries],
  );

  const clear = useCallback(() => setEntries(() => []), [setEntries]);

  return { items: parsed, ids: parsed.map((p) => p.productId), has, toggle, remove, clear };
}
