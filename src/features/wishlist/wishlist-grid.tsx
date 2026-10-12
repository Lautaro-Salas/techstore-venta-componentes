"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Trash2 } from "lucide-react";
import { Price } from "@/components/product/price";
import { StockBadge } from "@/components/product/stock-badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { moveWishlistToCartAction, toggleWishlistAction } from "@/features/engagement/actions";
import type { ProductCardData } from "@/types/catalog";
import { useWishlist } from "./wishlist-context";

function WishlistItem({ product }: { product: ProductCardData }) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const wishlist = useWishlist();

  const moveToCart = () =>
    startTransition(async () => {
      const result = await moveWishlistToCartAction(product.id);
      if (!result.ok) return toast.error("No pudimos moverlo al carrito", result.error);
      wishlist.set(product.id, false);
      toast.success("Movido al carrito", product.name);
    });

  const remove = () =>
    startTransition(async () => {
      const result = await toggleWishlistAction(product.id);
      if (!result.ok) return toast.error("No pudimos quitarlo", result.error);
      wishlist.set(product.id, false);
      toast.info("Quitado de favoritos");
    });

  return (
    <li className="card flex gap-4 p-4" aria-busy={pending}>
      <Link href={`/producto/${product.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-surface-2">
        {product.image && <Image src={product.image.url} alt={product.image.alt} fill sizes="96px" className="object-cover" unoptimized={product.image.url.endsWith(".svg")} />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-xs font-semibold text-muted uppercase">{product.brand.name}</span>
        <Link href={`/producto/${product.slug}`} className="line-clamp-2 text-sm font-medium hover:text-primary">{product.name}</Link>
        <Price price={product.price} compareAtPrice={product.compareAtPrice} size="sm" />
        <StockBadge level={product.stockLevel} available={product.available} />
        <div className="mt-auto flex flex-wrap gap-2">
          <Button size="sm" onClick={moveToCart} disabled={pending || product.available === 0} icon={<ShoppingCart className="size-3.5" aria-hidden />}>Mover al carrito</Button>
          <Button size="sm" variant="ghost" onClick={remove} disabled={pending} icon={<Trash2 className="size-3.5" aria-hidden />}>Quitar</Button>
        </div>
      </div>
    </li>
  );
}

export function WishlistGrid({ products }: { products: ProductCardData[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {products.map((p) => <WishlistItem key={p.id} product={p} />)}
    </ul>
  );
}
