import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { getEnvSiteUrl } from "@/lib/site";
import { flattenTree, getCategoryTree } from "@/services/catalog/categories.service";

/** Se regenera en cada request para reflejar el catálogo actual. */
export const dynamic = "force-dynamic";

const STATIC_PATHS = ["", "/productos", "/ofertas", "/marcas", "/contacto", "/faq", "/nosotros"];
const LEGAL_SLUGS = ["terminos", "privacidad", "cambios", "devoluciones", "garantia", "envios"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getEnvSiteUrl();
  const [tree, products, brands] = await Promise.all([
    getCategoryTree(),
    db.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
    db.brand.findMany({ where: { products: { some: { status: "ACTIVE" } } }, select: { slug: true } }),
  ]);
  return [
    ...STATIC_PATHS.map((p) => ({ url: `${site}${p}`, changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.6 })),
    ...LEGAL_SLUGS.map((s) => ({ url: `${site}/legales/${s}`, changeFrequency: "yearly" as const, priority: 0.2 })),
    ...flattenTree(tree).map((c) => ({ url: `${site}${c.href}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...brands.map((b) => ({ url: `${site}/marcas/${b.slug}`, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...products.map((p) => ({ url: `${site}/producto/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "daily" as const, priority: 0.9 })),
  ];
}
