"use server";

import { revalidatePath } from "next/cache";
import { parseOrThrow, runAction } from "@/lib/actions";
import { AppError } from "@/lib/errors";
import { requirePermission } from "@/lib/auth/guards";
import { idSchema } from "@/schemas/common";
import { toggleUserActive } from "@/services/admin/customers.service";
import type { ActionResult } from "@/types/actions";

/** Activa/desactiva una cuenta de usuario. Un admin no puede tocarse a sí mismo. */
export async function toggleUserStatusAction(
  userId: string,
): Promise<ActionResult<{ isActive: boolean }>> {
  return runAction(async () => {
    const actor = await requirePermission("users:manage");
    const id = parseOrThrow(idSchema, userId);
    if (id === actor.id) {
      throw new AppError(
        "CONFLICT",
        "No podés cambiar el estado de tu propia cuenta desde el panel.",
      );
    }
    const result = await toggleUserActive(id, actor.id);
    revalidatePath("/admin/clientes");
    return result;
  });
}
