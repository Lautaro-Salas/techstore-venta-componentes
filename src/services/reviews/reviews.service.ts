import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { ReviewInput } from "@/schemas/contact";
import { findPurchaseOrderId } from "@/services/orders/order-queries";

const REVIEWS_PAGE_SIZE = 10;
const STARS = [5, 4, 3, 2, 1] as const;

export interface ReviewSummary {
  average: number;
  count: number;
  distribution: { stars: number; count: number }[];
}

export async function getReviewSummary(productId: string): Promise<ReviewSummary> {
  const groups = await db.review.groupBy({
    by: ["rating"],
    where: { productId, status: "PUBLISHED" },
    _count: { _all: true },
  });
  const count = groups.reduce((s, g) => s + g._count._all, 0);
  const sum = groups.reduce((s, g) => s + g.rating * g._count._all, 0);
  return {
    average: count ? Math.round((sum / count) * 10) / 10 : 0,
    count,
    distribution: STARS.map((stars) => ({
      stars,
      count: groups.find((g) => g.rating === stars)?._count._all ?? 0,
    })),
  };
}

export async function listProductReviews(productId: string, page = 1) {
  return db.review.findMany({
    where: { productId, status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * REVIEWS_PAGE_SIZE,
    take: REVIEWS_PAGE_SIZE,
    select: {
      id: true,
      rating: true,
      title: true,
      comment: true,
      createdAt: true,
      user: { select: { firstName: true, lastName: true } },
    },
  });
}

export type ReviewEligibility = "anonymous" | "not_purchased" | "already_reviewed" | "eligible";

export async function getReviewEligibility(
  userId: string | undefined,
  productId: string,
): Promise<ReviewEligibility> {
  if (!userId) return "anonymous";
  const existing = await db.review.findUnique({
    where: { productId_userId: { productId, userId } },
    select: { id: true },
  });
  if (existing) return "already_reviewed";
  return (await findPurchaseOrderId(userId, productId)) ? "eligible" : "not_purchased";
}

async function refreshProductRating(productId: string): Promise<void> {
  const summary = await getReviewSummary(productId);
  await db.product.update({
    where: { id: productId },
    data: { ratingAvg: summary.average, ratingCount: summary.count },
  });
}

export async function createReview(userId: string, input: ReviewInput): Promise<void> {
  const orderId = await findPurchaseOrderId(userId, input.productId);
  if (!orderId) throw new AppError("FORBIDDEN", "Solo podés opinar sobre productos que compraste.");
  const existing = await db.review.findUnique({
    where: { productId_userId: { productId: input.productId, userId } },
  });
  if (existing) throw new AppError("CONFLICT", "Ya dejaste una reseña para este producto.");
  await db.review.create({
    data: {
      productId: input.productId,
      userId,
      orderId,
      rating: input.rating,
      title: input.title || null,
      comment: input.comment,
    },
  });
  await refreshProductRating(input.productId);
}

export async function deleteOwnReview(userId: string, reviewId: string): Promise<void> {
  const review = await db.review.findFirst({ where: { id: reviewId, userId } });
  if (!review) throw new AppError("NOT_FOUND", "Reseña no encontrada.");
  await db.review.delete({ where: { id: review.id } });
  await refreshProductRating(review.productId);
}

export async function listUserReviews(userId: string) {
  return db.review.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      title: true,
      comment: true,
      createdAt: true,
      status: true,
      product: { select: { name: true, slug: true } },
    },
  });
}
