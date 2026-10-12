"use server";

import { parseOrThrow, runAction } from "@/lib/actions";
import { requirePermission } from "@/lib/auth/guards";
import { AppError } from "@/lib/errors";
import { revalidateProductDomain } from "@/lib/cache/revalidate";
import { idSchema, productSchema, type ProductFormValues } from "@/schemas/admin";
import * as products from "@/services/admin/products.service";
import { getStorage } from "@/services/storage";
import { validateImageUpload } from "@/services/storage/image-validation";
import type { ActionResult } from "@/types/actions";

const revalidateCatalog = revalidateProductDomain;

export async function saveProductAction(
  values: ProductFormValues,
  productId?: string,
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const user = await requirePermission("products:write");
    const input = parseOrThrow(productSchema, values);
    let id: string;
    if (productId) {
      id = parseOrThrow(idSchema, productId);
      await products.updateProduct(id, input, user.id);
    } else {
      id = await products.createProduct(input, user.id);
    }
    revalidateCatalog(id);
    return { id };
  });
}

export async function uploadProductImageAction(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  return runAction(async () => {
    await requirePermission("products:write");
    const file = formData.get("file");
    if (!(file instanceof File)) throw new AppError("VALIDATION", "Elegí una imagen para subir.");
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = validateImageUpload({ type: file.type, size: file.size }, buffer);
    return { url: await getStorage().save(buffer, ext) };
  });
}

export async function duplicateProductAction(
  productId: string,
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const user = await requirePermission("products:write");
    const id = await products.duplicateProduct(parseOrThrow(idSchema, productId), user.id);
    revalidateCatalog();
    return { id };
  });
}

export async function toggleProductStatusAction(
  productId: string,
): Promise<ActionResult<{ status: string }>> {
  return runAction(async () => {
    const user = await requirePermission("products:write");
    const id = parseOrThrow(idSchema, productId);
    const status = await products.toggleProductStatus(id, user.id);
    revalidateCatalog(id);
    return { status };
  });
}

export async function deleteProductAction(
  productId: string,
): Promise<ActionResult<{ archived: boolean }>> {
  return runAction(async () => {
    const user = await requirePermission("products:delete");
    const result = await products.deleteOrArchiveProduct(
      parseOrThrow(idSchema, productId),
      user.id,
    );
    revalidateCatalog();
    return result;
  });
}
