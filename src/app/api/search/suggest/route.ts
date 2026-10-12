import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { flattenTree, getCategoryTree } from "@/services/catalog/categories.service";
import { MIN_QUERY_LENGTH, normalizeText, sanitizeQuery } from "@/services/search/rules";
import { didYouMean, searchProductIds } from "@/services/search/search.service";
import type { SearchSuggestions } from "@/types/search";

const MAX_PRODUCTS = 6;
const MAX_TERMS = 4;
const CACHE_SECONDS = 60;

export async function GET(request: NextRequest) {
  const q = sanitizeQuery(request.nextUrl.searchParams.get("q"));
  const empty: SearchSuggestions = {
    query: q,
    products: [],
    categories: [],
    brands: [],
    didYouMean: null,
  };
  if (q.length < MIN_QUERY_LENGTH) return NextResponse.json(empty);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit("search", ip))
    return NextResponse.json({ error: "Demasiadas búsquedas" }, { status: 429 });

  try {
    const ids = (await searchProductIds(q)).slice(0, MAX_PRODUCTS);
    const [rows, tree, brands] = await Promise.all([
      db.product.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          brand: { select: { name: true } },
          images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
        },
      }),
      getCategoryTree(),
      db.brand.findMany({ select: { name: true, slug: true } }),
    ]);
    const order = new Map(ids.map((id, i) => [id, i]));
    const products = rows
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      .map((r) => ({
        name: r.name,
        slug: r.slug,
        price: r.price,
        brand: r.brand.name,
        image: r.images[0]?.url ?? null,
      }));
    const categories = flattenTree(tree)
      .filter((c) => normalizeText(c.name).includes(q))
      .slice(0, MAX_TERMS)
      .map((c) => ({ name: c.name, href: c.href }));
    const matchedBrands = brands
      .filter((b) => normalizeText(b.name).includes(q))
      .slice(0, MAX_TERMS);

    const body: SearchSuggestions = {
      query: q,
      products,
      categories,
      brands: matchedBrands,
      didYouMean: products.length === 0 ? await didYouMean(q) : null,
    };
    return NextResponse.json(body, {
      headers: { "Cache-Control": `public, max-age=${CACHE_SECONDS}` },
    });
  } catch (error) {
    logger.error("Error en sugerencias de búsqueda", error);
    return NextResponse.json({ error: "No pudimos buscar en este momento" }, { status: 500 });
  }
}
