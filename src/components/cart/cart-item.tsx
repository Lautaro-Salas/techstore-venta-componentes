"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Minus, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { removeCartItemAction, updateCartItemAction } from "@/features/cart/actions";
import { toAnalyticsItem, track } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MAX_QUANTITY_PER_ITEM } from "@/services/cart/rules";
import type { CartLineView } from "@/types/cart";

export function CartItem({ line }: { line: CartLineView }) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const { product } = line;
  const max = Math.min(product.available, MAX_QUANTITY_PER_ITEM);

  const setQuantity = (quantity: number) =>
    startTransition(async () => {
      const result = await updateCartItemAction(line.productId, quantity);
      if (!result.ok) toast.error("No pudimos actualizar la cantidad", result.error);
    });

  const remove = () =>
    startTransition(async () => {
      const result = await removeCartItemAction(line.productId);
      if (!result.ok) return toast.error("No pudimos quitar el producto", result.error);
      track("remove_from_cart", { value: line.lineTotal, items: [toAnalyticsItem(product, line.quantity)] });
      toast.info("Producto eliminado del carrito");
    });

  return (
    <li className={cn("flex gap-4 py-5 transition-opacity", pending && "opacity-60")} aria-busy={pending}>
      <Link href={`/producto/${product.slug}`} className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:size-24">
        {product.image && <Image src={product.image.url} alt={product.image.alt} fill sizes="96px" className="object-cover" unoptimized={product.image.url.endsWith(".svg")} />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted uppercase">{product.brand.name}</p>
            <Link href={`/producto/${product.slug}`} className="line-clamp-2 text-sm font-medium hover:text-primary">{product.name}</Link>
            <p className="mt-0.5 text-xs text-muted">{formatPrice(product.price)} c/u</p>
          </div>
          <p className="shrink-0 font-semibold tabular-nums">{formatPrice(line.lineTotal)}</p>
        </div>
        {line.issue && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-warning"><AlertTriangle className="size-3.5" aria-hidden /> {line.issue}</p>
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center rounded-xl border border-border" role="group" aria-label={`Cantidad de ${product.name}`}>
            <button type="button" onClick={() => setQuantity(line.quantity - 1)} disabled={pending || line.quantity <= 1} className="grid size-9 place-items-center disabled:opacity-40" aria-label="Restar uno">
              <Minus className="size-4" aria-hidden />
            </button>
            <span className="w-9 text-center text-sm font-semibold tabular-nums">{line.quantity}</span>
            <button type="button" onClick={() => setQuantity(line.quantity + 1)} disabled={pending || line.quantity >= max} className="grid size-9 place-items-center disabled:opacity-40" aria-label="Sumar uno">
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
          <button type="button" onClick={remove} disabled={pending} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-danger-soft hover:text-danger">
            <Trash2 className="size-4" aria-hidden /> <span className="hidden sm:inline">Eliminar</span>
          </button>
        </div>
      </div>
    </li>
  );
}
