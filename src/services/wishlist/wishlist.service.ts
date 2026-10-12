import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { productCardInclude, toProductCard } from "@/services/catalog/mappers";
import type { ProductCardData } from "@/types/catalog";

async function wishlistId(userId: string): Promise<string> {
  const list = await db.wishlist.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true },
  });
  return list.id;
}

/** Memoizada por request: el root layout y la grilla de favoritos comparten la query. */
export const getWishlistProductIds = cache(async (userId: string): Promise<string[]> => {
  const items = await db.wishlistItem.findMany({
    where: { wishlist: { userId } },
    select: { productId: true },
  });
  return items.map((i) => i.productId);
});

export async function getWishlistProducts(userId: string): Promise<ProductCardData[]> {
  const items = await db.wishlistItem.findMany({
    where: { wishlist: { userId }, product: { status: "ACTIVE" } },
    orderBy: { createdAt: "desc" },
    include: { product: { include: productCardInclude } },
  });
  return items.map((i) => toProductCard(i.product));
}

/** Agrega o quita. Devuelve true si quedó en favoritos. */
export async function toggleWishlist(userId: string, productId: string): Promise<boolean> {
  const id = await wishlistId(userId);
  const existing = await db.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: id, productId } },
  });
  if (existing) {
    await db.wishlistItem.delete({ where: { id: existing.id } });
    return false;
  }
  await db.wishlistItem.create({ data: { wishlistId: id, productId } });
  return true;
}

export async function removeFromWishlist(userId: string, productId: string): Promise<void> {
  await db.wishlistItem.deleteMany({ where: { productId, wishlist: { userId } } });
}
