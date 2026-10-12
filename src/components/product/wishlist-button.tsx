"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { toggleWishlistAction } from "@/features/engagement/actions";
import { useWishlist } from "@/features/wishlist/wishlist-context";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export function WishlistButton({ productId, productName, price, className, withLabel = false }: { productId: string; productName: string; price: number; className?: string; withLabel?: boolean }) {
  const wishlist = useWishlist();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const active = wishlist.has(productId);

  const onClick = () => {
    if (!wishlist.isAuthenticated) {
      router.push(`/ingresar?next=${encodeURIComponent(pathname)}`);
      return;
    }
    wishlist.set(productId, !active);
    startTransition(async () => {
      const result = await toggleWishlistAction(productId);
      if (!result.ok) {
        wishlist.set(productId, active);
        toast.error("No pudimos actualizar tus favoritos", result.error);
        return;
      }
      if (result.data.inWishlist) {
        track("wishlist_add", { value: price, items: [{ item_id: productId, item_name: productName, price }] });
        toast.success("Guardado en favoritos");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={active}
      aria-label={active ? `Quitar ${productName} de favoritos` : `Agregar ${productName} a favoritos`}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full transition-colors",
        withLabel ? "h-11 rounded-xl border border-border px-4 text-sm font-medium hover:bg-surface-2" : "size-9 bg-surface/90 shadow-sm backdrop-blur hover:bg-surface",
        className,
      )}
    >
      <Heart className={cn("size-4.5", active ? "fill-danger text-danger" : "text-muted")} aria-hidden />
      {withLabel && (active ? "En favoritos" : "Favorito")}
    </button>
  );
}
