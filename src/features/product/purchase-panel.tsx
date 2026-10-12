"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { CompareToggle } from "@/components/product/compare-toggle";
import { WishlistButton } from "@/components/product/wishlist-button";
import { toAnalyticsItem, track } from "@/lib/analytics";
import { MAX_QUANTITY_PER_ITEM } from "@/services/cart/rules";
import type { ProductCardData } from "@/types/catalog";

export function PurchasePanel({ product }: { product: ProductCardData }) {
  const [quantity, setQuantity] = useState(1);
  const max = Math.min(product.available, MAX_QUANTITY_PER_ITEM);

  useEffect(() => {
    track("product_view", { value: product.price, items: [toAnalyticsItem(product)] });
  }, [product]);

  return (
    <div className="flex flex-col gap-3">
      {product.available > 0 && (
        <div className="flex items-center gap-3">
          <span id="qty-label" className="text-sm font-medium">Cantidad</span>
          <div className="flex items-center rounded-xl border border-border" role="group" aria-labelledby="qty-label">
            <button type="button" onClick={() => setQuantity((q) => Math.max(q - 1, 1))} disabled={quantity <= 1} className="grid size-10 place-items-center disabled:opacity-40" aria-label="Restar uno">
              <Minus className="size-4" aria-hidden />
            </button>
            <output className="w-10 text-center text-sm font-semibold tabular-nums" aria-live="polite">{quantity}</output>
            <button type="button" onClick={() => setQuantity((q) => Math.min(q + 1, max))} disabled={quantity >= max} className="grid size-10 place-items-center disabled:opacity-40" aria-label="Sumar uno">
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
          <span className="text-xs text-muted">{product.available} disponibles</span>
        </div>
      )}
      <AddToCartButton product={product} quantity={quantity} size="lg" />
      <div className="grid grid-cols-2 gap-2">
        <WishlistButton productId={product.id} productName={product.name} price={product.price} withLabel className="w-full" />
        <CompareToggle productId={product.id} categoryId={product.category.id} withLabel className="w-full justify-center" />
      </div>
    </div>
  );
}
