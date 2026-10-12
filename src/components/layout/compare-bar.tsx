"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitCompareArrows, X } from "lucide-react";
import { useCompare } from "@/features/compare/use-compare";

/** Barra flotante que aparece cuando hay productos en el comparador. */
export function CompareBar() {
  const compare = useCompare();
  const pathname = usePathname();
  if (compare.ids.length === 0 || pathname === "/comparar" || pathname.startsWith("/checkout"))
    return null;
  return (
    <div className="fixed inset-x-0 bottom-16 z-30 flex justify-center px-4 lg:bottom-6">
      <div className="animate-fade-in border-border bg-surface flex items-center gap-3 rounded-2xl border px-4 py-2.5 shadow-[0_16px_40px_-12px_rgb(10_20_32/0.18)] shadow-xl">
        <GitCompareArrows className="text-primary size-5" aria-hidden />
        <span className="text-sm font-medium">
          {compare.ids.length} {compare.ids.length === 1 ? "producto" : "productos"} para comparar
        </span>
        <Link
          href="/comparar"
          className="bg-cta text-primary-foreground shadow-primary/20 rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm transition hover:brightness-105"
        >
          Comparar
        </Link>
        <button
          type="button"
          onClick={compare.clear}
          className="text-muted hover:bg-surface-2 rounded-lg p-1.5"
          aria-label="Vaciar comparador"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
