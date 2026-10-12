import type { ProductCardData } from "@/types/catalog";
import { ProductCard, type InstallmentHint } from "./product-card";

export function ProductGrid({
  products,
  installments,
  priorityCount = 0,
}: {
  products: ProductCardData[];
  installments?: InstallmentHint | null;
  priorityCount?: number;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product, i) => (
        <li key={product.id} className="animate-fade-in">
          <ProductCard product={product} installments={installments} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}

/** Fila con scroll horizontal en mobile y grilla en desktop. */
export function ProductRow({
  products,
  installments,
}: {
  products: ProductCardData[];
  installments?: InstallmentHint | null;
}) {
  return (
    <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
      {products.map((product) => (
        <li key={product.id} className="w-[46%] shrink-0 snap-start sm:w-auto">
          <ProductCard product={product} installments={installments} />
        </li>
      ))}
    </ul>
  );
}
