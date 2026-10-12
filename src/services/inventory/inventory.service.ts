import "server-only";
import { Prisma, type InventoryMovementType } from "@prisma/client";
import { db, type TransactionClient } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { adjust, availableStock } from "./rules";
import { recordAudit } from "@/services/admin/audit.service";

export interface StockLine {
  productId: string;
  quantity: number;
}

/** Recalcula el stock disponible desnormalizado del producto. */
async function syncAvailable(tx: TransactionClient, productId: string): Promise<void> {
  await tx.$executeRaw(Prisma.sql`
    UPDATE "Product" SET "availableStock" = COALESCE((
      SELECT SUM(CASE WHEN i.quantity - i.reserved > 0 THEN i.quantity - i.reserved ELSE 0 END)
      FROM "Inventory" i WHERE i."productId" = ${productId}
    ), 0)
    WHERE id = ${productId}
  `);
}

async function inventoriesFor(tx: TransactionClient, productId: string) {
  return tx.inventory.findMany({
    where: { productId },
    orderBy: { warehouse: { isDefault: "desc" } },
    include: { warehouse: { select: { isDefault: true } } },
  });
}

async function recordMovement(
  tx: TransactionClient,
  data: { productId: string; warehouseId: string; type: InventoryMovementType; quantity: number; reason?: string; orderId?: string; userId?: string },
): Promise<void> {
  await tx.inventoryMovement.create({ data });
}

/**
 * Reserva stock para un pedido, repartiendo entre depósitos (el predeterminado primero).
 * El UPDATE condicional evita sobreventa ante compras concurrentes.
 */
export async function reserveStock(tx: TransactionClient, lines: StockLine[], orderId: string): Promise<void> {
  for (const line of lines) {
    let pending = line.quantity;
    for (const inv of await inventoriesFor(tx, line.productId)) {
      if (pending === 0) break;
      const take = Math.min(pending, availableStock(inv));
      if (take <= 0) continue;
      const updated = await tx.$executeRaw(Prisma.sql`
        UPDATE "Inventory" SET reserved = reserved + ${take}, "updatedAt" = ${new Date()}
        WHERE id = ${inv.id} AND quantity - reserved >= ${take}
      `);
      if (updated === 0) continue;
      await recordMovement(tx, { productId: line.productId, warehouseId: inv.warehouseId, type: "RESERVATION", quantity: -take, orderId });
      pending -= take;
    }
    if (pending > 0) {
      throw new AppError("OUT_OF_STOCK", "Uno de los productos ya no tiene stock suficiente. Revisá tu carrito.");
    }
    await syncAvailable(tx, line.productId);
  }
}

/** Reservas vigentes de un pedido agrupadas por producto y depósito. */
async function orderReservations(tx: TransactionClient, orderId: string) {
  const movements = await tx.inventoryMovement.findMany({
    where: { orderId, type: { in: ["RESERVATION", "RELEASE", "SALE"] } },
  });
  const map = new Map<string, { productId: string; warehouseId: string; units: number }>();
  for (const m of movements) {
    const key = `${m.productId}:${m.warehouseId}`;
    const entry = map.get(key) ?? { productId: m.productId, warehouseId: m.warehouseId, units: 0 };
    // RESERVATION es negativo; RELEASE y SALE cierran la reserva con positivo
    entry.units += m.type === "RESERVATION" ? -m.quantity : -Math.abs(m.quantity);
    map.set(key, entry);
  }
  return [...map.values()].filter((r) => r.units > 0);
}

/** Pedido confirmado/pagado: la reserva se convierte en venta. */
export async function commitOrderStock(tx: TransactionClient, orderId: string): Promise<void> {
  for (const r of await orderReservations(tx, orderId)) {
    await tx.inventory.update({
      where: { productId_warehouseId: { productId: r.productId, warehouseId: r.warehouseId } },
      data: { quantity: { decrement: r.units }, reserved: { decrement: r.units } },
    });
    await recordMovement(tx, { productId: r.productId, warehouseId: r.warehouseId, type: "SALE", quantity: -r.units, orderId });
    await tx.product.update({ where: { id: r.productId }, data: { soldCount: { increment: r.units } } });
    await syncAvailable(tx, r.productId);
  }
}

/** Pedido cancelado: libera la reserva. */
export async function releaseOrderStock(tx: TransactionClient, orderId: string): Promise<void> {
  for (const r of await orderReservations(tx, orderId)) {
    await tx.inventory.update({
      where: { productId_warehouseId: { productId: r.productId, warehouseId: r.warehouseId } },
      data: { reserved: { decrement: r.units } },
    });
    await recordMovement(tx, { productId: r.productId, warehouseId: r.warehouseId, type: "RELEASE", quantity: r.units, orderId });
    await syncAvailable(tx, r.productId);
  }
}

/** Pedido cancelado después de confirmado: las unidades vendidas vuelven al stock. */
export async function returnOrderStock(tx: TransactionClient, orderId: string): Promise<void> {
  const sales = await tx.inventoryMovement.findMany({ where: { orderId, type: "SALE" } });
  const returned = await tx.inventoryMovement.findMany({ where: { orderId, type: "RETURN" } });
  if (returned.length > 0) return;
  for (const sale of sales) {
    const units = Math.abs(sale.quantity);
    await tx.inventory.update({
      where: { productId_warehouseId: { productId: sale.productId, warehouseId: sale.warehouseId } },
      data: { quantity: { increment: units } },
    });
    await recordMovement(tx, { productId: sale.productId, warehouseId: sale.warehouseId, type: "RETURN", quantity: units, orderId });
    await tx.product.update({ where: { id: sale.productId }, data: { soldCount: { decrement: units } } });
    await syncAvailable(tx, sale.productId);
  }
}

/** Productos cuyo disponible quedó en o por debajo del mínimo. */
export async function findLowStock(productIds: string[]) {
  const rows = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true, availableStock: true, inventory: { select: { minStock: true } } },
  });
  return rows.filter((r) => r.availableStock <= r.inventory.reduce((m, i) => Math.max(m, i.minStock), 0));
}

/** Ajuste manual desde el admin (ingreso de mercadería, corrección de conteo, etc.). */
export async function adjustStock(input: {
  productId: string;
  delta: number;
  reason: string;
  userId: string;
  minStock?: number;
}): Promise<void> {
  await db.$transaction(async (tx) => {
    const warehouse = await tx.warehouse.findFirst({ where: { isDefault: true } });
    if (!warehouse) throw new AppError("CONFLICT", "No hay un depósito predeterminado configurado.");
    const key = { productId_warehouseId: { productId: input.productId, warehouseId: warehouse.id } };
    const current = (await tx.inventory.findUnique({ where: key })) ?? { quantity: 0, reserved: 0 };
    const next = input.delta === 0 ? current : adjust(current, input.delta);
    await tx.inventory.upsert({
      where: key,
      create: { productId: input.productId, warehouseId: warehouse.id, quantity: next.quantity, minStock: input.minStock ?? 0 },
      update: { quantity: next.quantity, ...(input.minStock !== undefined ? { minStock: input.minStock } : {}) },
    });
    if (input.delta !== 0) {
      await recordMovement(tx, {
        productId: input.productId,
        warehouseId: warehouse.id,
        type: input.delta > 0 ? "PURCHASE" : "ADJUSTMENT",
        quantity: input.delta,
        reason: input.reason,
        userId: input.userId,
      });
    }
    await syncAvailable(tx, input.productId);
  });
  await recordAudit({
    action: "STOCK_ADJUST",
    entity: "inventory",
    entityId: input.productId,
    userId: input.userId,
    detail: `${input.delta > 0 ? "+" : ""}${input.delta} unidades · ${input.reason}`,
  });
}
