"use client";

import { GitCompareArrows } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useCompare } from "@/features/compare/use-compare";
import { cn } from "@/lib/utils";

export function CompareToggle({ productId, categoryId, className, withLabel = false }: { productId: string; categoryId: string; className?: string; withLabel?: boolean }) {
  const compare = useCompare();
  const toast = useToast();
  const active = compare.has(productId);

  const onClick = () => {
    const result = compare.toggle(productId, categoryId);
    if (result.error) toast.error("No se pudo agregar", result.error);
    else if (result.added) toast.info("Agregado al comparador", "Abrí el comparador desde la barra inferior.");
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium transition-colors",
        active ? "text-primary" : "text-muted hover:text-foreground",
        withLabel && "h-11 rounded-xl border border-border px-4 text-sm hover:bg-surface-2",
        className,
      )}
    >
      <GitCompareArrows className="size-4" aria-hidden />
      {active ? "Comparando" : "Comparar"}
    </button>
  );
}
