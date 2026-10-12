import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { formatPrice } from "@/lib/format";
import { discountPercent } from "@/services/pricing/rules";
import type { ProductCardData } from "@/types/catalog";
import { AddToCartButton } from "./add-to-cart-button";
import { CompareToggle } from "./compare-toggle";
import { Price } from "./price";
import { StockBadge } from "./stock-badge";
import { WishlistButton } from "./wishlist-button";

export interface InstallmentHint {
  installments: number;
}

export function ProductCard({
  product,
  installments,
  priority = false,
}: {
  product: ProductCardData;
  installments?: InstallmentHint | null;
  priority?: boolean;
}) {
  const off = discountPercent(product.price, product.compareAtPrice);
  const href = `/producto/${product.slug}`;
  return (
    <article className="group card hover:border-primary/30 relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative">
        <Link
          href={href}
          className="bg-surface-2/60 relative block aspect-square overflow-hidden"
          tabIndex={-1}
          aria-hidden
        >
          {product.image && (
            <Image
              src={product.image.url}
              alt={product.image.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.03]"
              priority={priority}
              unoptimized={product.image.url.endsWith(".svg")}
            />
          )}
        </Link>
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {off > 0 && <Badge tone="solid">-{off}%</Badge>}
        </div>
        <WishlistButton
          productId={product.id}
          productName={product.name}
          price={product.price}
          className="absolute top-2 right-2"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted text-xs font-semibold tracking-wide uppercase">
            {product.brand.name}
          </span>
          {product.ratingCount > 0 && (
            <Rating value={product.ratingAvg} count={product.ratingCount} />
          )}
        </div>
        <h3 className="line-clamp-2 min-h-10 text-sm leading-snug font-medium">
          <Link
            href={href}
            className="hover:text-primary after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {product.name}
          </Link>
        </h3>
        <Price price={product.price} compareAtPrice={product.compareAtPrice} />
        {installments && product.available > 0 && (
          <p className="text-success text-xs">
            {installments.installments} cuotas sin interés de{" "}
            {formatPrice(Math.ceil(product.price / installments.installments))}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <StockBadge level={product.stockLevel} available={product.available} />
          <span className="text-muted hidden items-center gap-1 text-xs sm:inline-flex">
            <ShieldCheck className="size-3.5" aria-hidden /> {product.warrantyMonths} meses
          </span>
        </div>
        <div className="relative z-10 flex flex-col gap-2">
          <AddToCartButton product={product} size="sm" />
          <CompareToggle
            productId={product.id}
            categoryId={product.category.id}
            className="self-center"
          />
        </div>
      </div>
    </article>
  );
}
