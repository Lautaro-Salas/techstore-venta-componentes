import type { Metadata } from "next";
import { PageTransition } from "@/components/navigation/page-transition";
import { CatalogView } from "@/features/catalog/catalog-view";
import type { RawSearchParams } from "@/features/catalog/params";

interface Props {
  searchParams: Promise<RawSearchParams>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const raw = typeof sp.pagina === "string" ? Number.parseInt(sp.pagina, 10) : NaN;
  const page = Number.isFinite(raw) && raw > 1 ? raw : 1;
  return {
    title: "Ofertas",
    description: "Productos con precio rebajado y stock disponible.",
    alternates: { canonical: page > 1 ? `/ofertas?pagina=${page}` : "/ofertas" },
  };
}

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  return (
    <PageTransition>
      <CatalogView
        title="Ofertas"
        description="Precios rebajados por tiempo limitado o hasta agotar stock."
        breadcrumbs={[
          { name: "Inicio", href: "/" },
          { name: "Ofertas", href: "/ofertas" },
        ]}
        basePath="/ofertas"
        searchParams={await searchParams}
        scope={{ onSale: true }}
      />
    </PageTransition>
  );
}
