"use server";

import { parseOrThrow, runAction } from "@/lib/actions";
import { requirePermission } from "@/lib/auth/guards";
import { stockAdjustSchema, type StockAdjustValues } from "@/schemas/admin";
import { adjustStock } from "@/services/inventory/inventory.service";
import { getInventoryRow, type InventoryRow } from "@/services/admin/inventory.service";
import { revalidateInventory } from "@/lib/cache/revalidate";
import type { ActionResult } from "@/types/actions";

/** Ajusta el stock de un producto con motivo y autor registrados. */
export async function adjustStockAction(
  values: StockAdjustValues,
): Promise<ActionResult<{ row: InventoryRow | null }>> {
  return runAction(async () => {
    const user = await requirePermission("inventory:write");
    const input = parseOrThrow(stockAdjustSchema, values);
    await adjustStock({
      productId: input.productId,
      delta: input.delta,
      reason: input.reason,
      userId: user.id,
      minStock: input.minStock,
    });
    revalidateInventory();
    return { row: await getInventoryRow(input.productId) };
  });
}
