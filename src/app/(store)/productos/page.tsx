import type { Metadata } from "next";
import { PageTransition } from "@/components/navigation/page-transition";
import { CatalogView } from "@/features/catalog/catalog-view";
import type { RawSearchParams } from "@/features/catalog/params";
import { getCategoryTree } from "@/services/catalog/categories.service";

interface Props {
  searchParams: Promise<RawSearchParams>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q : undefined;
  const raw = typeof sp.pagina === "string" ? Number.parseInt(sp.pagina, 10) : NaN;
  const page = Number.isFinite(raw) && raw > 1 ? raw : 1;
  // La página 2+ se declara variante de la base; las búsquedas quedan canónicas a la base.
  const canonical = !query && page > 1 ? `/productos?pagina=${page}` : "/productos";
  return {
    title: query ? `Resultados para “${query}”` : "Todos los productos",
    alternates: { canonical },
    robots: query ? { index: false, follow: true } : undefined,
  };
}

export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.trim() : "";
  const tree = await getCategoryTree();
  return (
    <PageTransition>
      <CatalogView
        title={query ? `Resultados para “${query}”` : "Todos los productos"}
        description={
          query
            ? undefined
            : "Explorá el catálogo completo con filtros por marca, precio y especificaciones."
        }
        breadcrumbs={[
          { name: "Inicio", href: "/" },
          { name: query ? "Búsqueda" : "Productos", href: "/productos" },
        ]}
        basePath="/productos"
        searchParams={sp}
        scope={{}}
        subcategories={query ? undefined : tree}
      />
    </PageTransition>
  );
}
