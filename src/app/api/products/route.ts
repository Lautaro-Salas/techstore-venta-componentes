import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { getProductsByIds } from "@/services/catalog/products.service";

const MAX_IDS = 12;
const ID_PATTERN = /^[a-z0-9]{10,40}$/i;

/** Tarjetas de producto por IDs (vistos recientemente, comparador). */
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => ID_PATTERN.test(s))
    .slice(0, MAX_IDS);
  if (ids.length === 0) return NextResponse.json({ products: [] });
  try {
    return NextResponse.json(
      { products: await getProductsByIds(ids) },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    logger.error("Error obteniendo productos por IDs", error);
    return NextResponse.json({ error: "No pudimos cargar los productos" }, { status: 500 });
  }
}
