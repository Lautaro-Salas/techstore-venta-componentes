"use server";

import { revalidatePath } from "next/cache";
import { formDataToObject, parseOrThrow, runAction } from "@/lib/actions";
import { AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/auth/guards";
import { getClientIp } from "@/lib/auth/session";
import { idSchema } from "@/schemas/common";
import { contactSchema, newsletterSchema, reviewSchema } from "@/schemas/contact";
import { addToCart } from "@/services/cart/cart.service";
import { submitContactMessage, subscribeNewsletter } from "@/services/contact/contact.service";
import { createReview, deleteOwnReview } from "@/services/reviews/reviews.service";
import { removeFromWishlist, toggleWishlist } from "@/services/wishlist/wishlist.service";
import type { ActionResult, FormState } from "@/types/actions";

async function rateLimited(name: "contact" | "review" | "newsletter") {
  if (!checkRateLimit(name, await getClientIp())) {
    throw new AppError("RATE_LIMITED", "Demasiados envíos seguidos. Probá de nuevo en un rato.");
  }
}

export async function toggleWishlistAction(
  productId: string,
): Promise<ActionResult<{ inWishlist: boolean }>> {
  return runAction(async () => {
    const user = await requireUser();
    const inWishlist = await toggleWishlist(user.id, parseOrThrow(idSchema, productId));
    revalidatePath("/favoritos");
    return { inWishlist };
  });
}

export async function moveWishlistToCartAction(productId: string): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireUser();
    const id = parseOrThrow(idSchema, productId);
    await addToCart(id, 1);
    await removeFromWishlist(user.id, id);
    revalidatePath("/", "layout");
    return undefined;
  });
}

export async function createReviewAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return runAction(async () => {
    const user = await requireUser();
    await rateLimited("review");
    const input = parseOrThrow(reviewSchema, formDataToObject(formData));
    await createReview(user.id, input);
    const slug = formData.get("slug");
    if (typeof slug === "string") revalidatePath(`/producto/${slug}`);
    revalidatePath("/cuenta/resenas");
  });
}

export async function deleteReviewAction(reviewId: string): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireUser();
    await deleteOwnReview(user.id, parseOrThrow(idSchema, reviewId));
    revalidatePath("/cuenta/resenas");
    // El promedio y el listado de reseñas se muestran en la ficha del producto.
    revalidatePath("/producto/[slug]", "page");
    return undefined;
  });
}

export async function contactAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return runAction(async () => {
    await rateLimited("contact");
    const input = parseOrThrow(contactSchema, formDataToObject(formData));
    await submitContactMessage(input, await getClientIp());
  });
}

export async function newsletterAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return runAction(async () => {
    await rateLimited("newsletter");
    const input = parseOrThrow(newsletterSchema, formDataToObject(formData));
    await subscribeNewsletter(input.email);
  });
}
