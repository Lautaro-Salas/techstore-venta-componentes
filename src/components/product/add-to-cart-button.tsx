"use client";

import { useState, useTransition } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { Button, type ButtonSize } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { addToCartAction } from "@/features/cart/actions";
import { toAnalyticsItem, track } from "@/lib/analytics";
import type { ProductCardData } from "@/types/catalog";

const FEEDBACK_MS = 1800;

interface Props {
  product: Pick<ProductCardData, "id" | "name" | "price" | "brand" | "category" | "available">;
  quantity?: number;
  size?: ButtonSize;
  label?: string;
  className?: string;
}

export function AddToCartButton({ product, quantity = 1, size = "md", label = "Agregar al carrito", className }: Props) {
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const toast = useToast();

  if (product.available <= 0) {
    return (
      <Button size={size} variant="secondary" disabled fullWidth className={className}>
        Sin stock
      </Button>
    );
  }

  const onClick = () =>
    startTransition(async () => {
      const result = await addToCartAction(product.id, quantity);
      if (!result.ok) {
        toast.error("No pudimos agregarlo", result.error);
        return;
      }
      track("add_to_cart", { value: product.price * quantity, items: [toAnalyticsItem(product, quantity)] });
      setAdded(true);
      toast.success("Agregado al carrito", product.name);
      window.setTimeout(() => setAdded(false), FEEDBACK_MS);
    });

  return (
    <Button
      size={size}
      fullWidth
      loading={pending}
      onClick={onClick}
      className={className}
      icon={added ? <Check className="size-4" aria-hidden /> : <ShoppingCart className="size-4" aria-hidden />}
    >
      {added ? "¡Agregado!" : label}
    </Button>
  );
}
