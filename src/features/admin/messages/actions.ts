"use server";

import { revalidatePath } from "next/cache";
import { parseOrThrow, runAction } from "@/lib/actions";
import { requirePermission } from "@/lib/auth/guards";
import { contactStatusSchema, idSchema } from "@/schemas/admin";
import { setContactMessageStatus } from "@/services/admin/messages.service";
import type { ActionResult } from "@/types/actions";

/** Marca un mensaje de contacto como leído o respondido. */
export async function setContactMessageStatusAction(
  messageId: string,
  status: string,
): Promise<ActionResult<{ status: string }>> {
  return runAction(async () => {
    const user = await requirePermission("messages:write");
    const id = parseOrThrow(idSchema, messageId);
    const next = parseOrThrow(contactStatusSchema, status);
    const result = await setContactMessageStatus(id, next, user.id);
    revalidatePath("/admin/mensajes");
    return { status: result };
  });
}
