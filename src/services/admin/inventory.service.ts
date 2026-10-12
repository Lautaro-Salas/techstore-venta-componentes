import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ADMIN_PAGE_SIZE, totalPages, type Paginated } from "@/lib/admin/query";

export const INVENTORY_FILTERS = ["todos", "bajo", "sin-stock", "alerta"] as const;
export type InventoryFilter = (typeof INVENTORY_FILTERS)[number];

const MOVEMENTS_LIMIT = 20;

export interface InventoryRow {
  id: string;
  name: string;
  sku: string;
  availableStock: number;
  quantity: number;
  reserved: number;
  minStock: number;
}

const MIN_STOCK_SQL = Prisma.sql`COALESCE(MAX(i."minStock"), 0)`;

/** Condiciones HAVING por filtro. "alerta" = stock bajo o sin stock. */
function havingFor(filter: InventoryFilter): Prisma.Sql {
  switch (filter) {
    case "bajo":
      return Prisma.sql`HAVING p."availableStock" > 0 AND p."availableStock" <= ${MIN_STOCK_SQL}`;
    case "sin-stock":
      return Prisma.sql`HAVING p."availableStock" <= 0`;
    case "alerta":
      return Prisma.sql`HAVING p."availableStock" <= ${MIN_STOCK_SQL}`;
    default:
      return Prisma.empty;
  }
}

function baseQuery(filter: InventoryFilter, q: string): Prisma.Sql {
  // SQLite: LIKE ya ignora mayúsculas ASCII (no existe ILIKE).
  const search = q ? Prisma.sql`AND (p.name LIKE ${`%${q}%`} OR p.sku LIKE ${`%${q}%`})` : Prisma.empty;
  return Prisma.sql`
    SELECT p.id, p.name, p.sku, p."availableStock",
      CAST(COALESCE(SUM(i.quantity), 0) AS INT) AS quantity,
      CAST(COALESCE(SUM(i.reserved), 0) AS INT) AS reserved,
      CAST(${MIN_STOCK_SQL} AS INT) AS "minStock"
    FROM "Product" p
    LEFT JOIN "Inventory" i ON i."productId" = p.id
    WHERE p.status <> 'ARCHIVED' ${search}
    GROUP BY p.id
    ${havingFor(filter)}
  `;
}

/**
 * El driver devuelve BigInt en las expresiones SQL (COUNT, SUM, CAST...).
 * React no puede renderizar BigInt, así que se normaliza a number.
 */
interface RawInventoryRow extends Omit<InventoryRow, "quantity" | "reserved" | "minStock"> {
  quantity: number | bigint;
  reserved: number | bigint;
  minStock: number | bigint;
}

function toInventoryRow(row: RawInventoryRow): InventoryRow {
  return {
    ...row,
    availableStock: Number(row.availableStock),
    quantity: Number(row.quantity),
    reserved: Number(row.reserved),
    minStock: Number(row.minStock),
  };
}

/** Stock agregado por producto (suma de depósitos), excluyendo archivados. */
export async function listInventory(params: { filter: InventoryFilter; q: string; page: number; pageSize?: number }): Promise<Paginated<InventoryRow>> {
  const pageSize = params.pageSize ?? ADMIN_PAGE_SIZE;
  const base = baseQuery(params.filter, params.q);
  const order = params.filter === "todos" ? Prisma.sql`ORDER BY p.name ASC` : Prisma.sql`ORDER BY p."availableStock" ASC, p.name ASC`;
  const [rows, countRows] = await Promise.all([
    db.$queryRaw<RawInventoryRow[]>(Prisma.sql`${base} ${order} LIMIT ${pageSize} OFFSET ${(params.page - 1) * pageSize}`),
    // COUNT(*) vuelve como BigInt desde el driver: se normaliza a number para paginar.
    db.$queryRaw<{ count: number | bigint }[]>(Prisma.sql`SELECT COUNT(*) AS count FROM (${base}) t`),
  ]);
  const total = Number(countRows[0]?.count ?? 0);
  return {
    items: rows.map(toInventoryRow),
    total,
    page: params.page,
    totalPages: totalPages(total, pageSize),
  };
}

/** Fila de inventario de un producto concreto (para el ajuste desde la URL). */
export async function getInventoryRow(productId: string): Promise<InventoryRow | null> {
  const rows = await db.$queryRaw<RawInventoryRow[]>(Prisma.sql`
    SELECT p.id, p.name, p.sku, p."availableStock",
      COALESCE(SUM(i.quantity), 0) AS quantity,
      COALESCE(SUM(i.reserved), 0) AS reserved,
      ${MIN_STOCK_SQL} AS "minStock"
    FROM "Product" p
    LEFT JOIN "Inventory" i ON i."productId" = p.id
    WHERE p.id = ${productId}
    GROUP BY p.id
  `);
  const row = rows[0];
  return row ? toInventoryRow(row) : null;
}

export async function getInventorySummary(): Promise<{ low: number; out: number }> {
  const rows = await db.$queryRaw<{ low: number | bigint; out: number | bigint }[]>(Prisma.sql`
    SELECT
      COALESCE(SUM(CASE WHEN t."availableStock" > 0 AND t."availableStock" <= t."minStock" THEN 1 ELSE 0 END), 0) AS low,
      COALESCE(SUM(CASE WHEN t."availableStock" <= 0 THEN 1 ELSE 0 END), 0) AS out
    FROM (${baseQuery("todos", "")}) t
  `);
  return { low: Number(rows[0]?.low ?? 0), out: Number(rows[0]?.out ?? 0) };
}

export async function getProductMovements(productId: string) {
  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true, name: true, sku: true } });
  if (!product) return null;
  const movements = await db.inventoryMovement.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: MOVEMENTS_LIMIT,
    include: {
      user: { select: { firstName: true, lastName: true } },
      order: { select: { id: true, number: true } },
      warehouse: { select: { name: true } },
    },
  });
  return { product, movements };
}
