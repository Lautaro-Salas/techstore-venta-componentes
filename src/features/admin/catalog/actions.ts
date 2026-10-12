"use server";

import { parseOrThrow, runAction } from "@/lib/actions";
import { requirePermission } from "@/lib/auth/guards";
import {
  brandSchema,
  categorySchema,
  type BrandFormValues,
  type CategoryFormValues,
} from "@/schemas/admin";
import { idSchema } from "@/schemas/common";
import * as catalog from "@/services/admin/catalog-config.service";
import { revalidateCatalogDomain } from "@/lib/cache/revalidate";
import type { ActionResult } from "@/types/actions";

const revalidateCatalog = revalidateCatalogDomain;

/* ------------------------------ Categorías ------------------------------ */

export async function saveCategoryAction(
  values: CategoryFormValues,
  categoryId?: string,
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const user = await requirePermission("products:write");
    const input = parseOrThrow(categorySchema, values);
    let id: string;
    if (categoryId) {
      id = parseOrThrow(idSchema, categoryId);
      await catalog.updateCategory(id, input, user.id);
    } else {
      id = await catalog.createCategory(input, user.id);
    }
    revalidateCatalog();
    return { id };
  });
}

export async function deleteCategoryAction(
  categoryId: string,
): Promise<ActionResult<void>> {
  return runAction(async () => {
    const user = await requirePermission("products:write");
    await catalog.deleteCategory(parseOrThrow(idSchema, categoryId), user.id);
    revalidateCatalog();
  });
}

export async function toggleCategoryAction(
  categoryId: string,
): Promise<ActionResult<{ isActive: boolean }>> {
  return runAction(async () => {
    const user = await requirePermission("products:write");
    const isActive = await catalog.toggleCategory(
      parseOrThrow(idSchema, categoryId),
      user.id,
    );
    revalidateCatalog();
    return { isActive };
  });
}

/* ------------------------------ Marcas ------------------------------ */

export async function saveBrandAction(
  values: BrandFormValues,
  brandId?: string,
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const user = await requirePermission("products:write");
    const input = parseOrThrow(brandSchema, values);
    let id: string;
    if (brandId) {
      id = parseOrThrow(idSchema, brandId);
      await catalog.updateBrand(id, input, user.id);
    } else {
      id = await catalog.createBrand(input, user.id);
    }
    revalidateCatalog();
    return { id };
  });
}

export async function deleteBrandAction(
  brandId: string,
): Promise<ActionResult<void>> {
  return runAction(async () => {
    const user = await requirePermission("products:write");
    await catalog.deleteBrand(parseOrThrow(idSchema, brandId), user.id);
    revalidateCatalog();
  });
}
