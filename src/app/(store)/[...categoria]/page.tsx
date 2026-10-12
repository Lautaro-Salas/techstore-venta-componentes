import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageTransition } from "@/components/navigation/page-transition";
import { CatalogView } from "@/features/catalog/catalog-view";
import type { RawSearchParams } from "@/features/catalog/params";
import {
  categoryBreadcrumbs,
  descendantIds,
  findCategoryByPath,
} from "@/services/catalog/categories.service";

interface Props {
  params: Promise<{ categoria: string[] }>;
  searchParams: Promise<RawSearchParams>;
}

const MAX_DEPTH = 3;

async function resolve(params: Props["params"]) {
  const { categoria } = await params;
  if (categoria.length > MAX_DEPTH) return null;
  return findCategoryByPath(categoria);
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const found = await resolve(params);
  if (!found) return { title: "Categoría no encontrada" };
  const sp = await searchParams;
  const filtered = Object.keys(sp).some((k) => k !== "pagina");
  const raw = typeof sp.pagina === "string" ? Number.parseInt(sp.pagina, 10) : NaN;
  const page = Number.isFinite(raw) && raw > 1 ? raw : 1;
  const canonical = page > 1 ? `${found.node.href}?pagina=${page}` : found.node.href;
  return {
    title: found.node.name,
    description:
      found.node.description ??
      `Comprá ${found.node.name} con envío a todo el país, cuotas y garantía oficial.`,
    alternates: { canonical },
    openGraph: {
      title: found.node.name,
      url: canonical,
      // El openGraph de la página reemplaza al del layout entero: incluir la imagen.
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: "Tienda de tecnología en Argentina",
        },
      ],
    },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const found = await resolve(params);
  if (!found) notFound();
  const { node, trail } = found;
  return (
    <PageTransition>
      <CatalogView
        title={node.name}
        description={node.description}
        breadcrumbs={categoryBreadcrumbs(trail)}
        basePath={node.href}
        searchParams={await searchParams}
        scope={{ categoryIds: descendantIds(node) }}
        subcategories={node.children}
      />
    </PageTransition>
  );
}
