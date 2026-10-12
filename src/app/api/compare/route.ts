import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { productCardInclude, toProductCard } from "@/services/catalog/mappers";
import type { CompareProduct } from "@/types/compare";

const MAX_IDS = 4;
const ID_PATTERN = /^[a-z0-9]{10,40}$/i;

/** Productos con especificaciones para la tabla comparativa. */
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .filter((s) => ID_PATTERN.test(s))
    .slice(0, MAX_IDS);
  if (ids.length === 0) return NextResponse.json({ products: [] });
  try {
    const rows = await db.product.findMany({
      where: { id: { in: ids }, status: "ACTIVE" },
      include: {
        ...productCardInclude,
        specifications: {
          orderBy: { sortOrder: "asc" },
          select: { key: true, label: true, value: true },
        },
      },
    });
    const order = new Map(ids.map((id, i) => [id, i]));
    const products: CompareProduct[] = rows
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      .map((r) => ({ ...toProductCard(r), specifications: r.specifications }));
    return NextResponse.json({ products });
  } catch (error) {
    logger.error("Error cargando comparación", error);
    return NextResponse.json({ error: "No pudimos cargar la comparación" }, { status: 500 });
  }
}
