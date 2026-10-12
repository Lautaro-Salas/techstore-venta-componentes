import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { discountPercent } from "@/services/pricing/rules";

export function Price({
  price,
  compareAtPrice,
  size = "md",
  className,
}: {
  price: number;
  compareAtPrice?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const off = discountPercent(price, compareAtPrice);
  const priceSize = { sm: "text-base", md: "text-lg sm:text-xl", lg: "text-3xl sm:text-4xl" }[size];
  return (
    <div className={cn("flex flex-col", className)}>
      {off > 0 && compareAtPrice && (
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <s className="text-muted" aria-label={`Precio anterior ${formatPrice(compareAtPrice)}`}>
            {formatPrice(compareAtPrice)}
          </s>
          <span className="text-success font-semibold">{off}% OFF</span>
        </div>
      )}
      <span className={cn("text-foreground font-bold tracking-tight tabular-nums", priceSize)}>
        {formatPrice(price)}
      </span>
    </div>
  );
}
