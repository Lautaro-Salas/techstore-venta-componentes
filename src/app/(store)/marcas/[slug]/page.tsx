import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PageTransition } from "@/components/navigation/page-transition";
import { CatalogView } from "@/features/catalog/catalog-view";
import type { RawSearchParams } from "@/features/catalog/params";
import { db } from "@/lib/db";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}

const getBrand = cache(async (params: Props["params"]) => {
  const { slug } = await params;
  return db.brand.findUnique({ where: { slug }, select: { name: true, slug: true } });
});

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [brand, sp] = await Promise.all([getBrand(params), searchParams]);
  if (!brand) return { title: "Marca no encontrada" };
  const raw = typeof sp.pagina === "string" ? Number.parseInt(sp.pagina, 10) : NaN;
  const page = Number.isFinite(raw) && raw > 1 ? raw : 1;
  const canonical = page > 1 ? `/marcas/${brand.slug}?pagina=${page}` : `/marcas/${brand.slug}`;
  return {
    title: `Productos ${brand.name}`,
    description: `Comprá productos ${brand.name} con garantía oficial y envío a todo el país.`,
    alternates: { canonical },
  };
}

export default async function BrandPage({ params, searchParams }: Props) {
  const brand = await getBrand(params);
  if (!brand) notFound();
  return (
    // key: cambia el slug de marca → fuerza la transición exit/enter entre catálogos.
    <PageTransition key={brand.slug}>
      <CatalogView
        title={brand.name}
        description={`Productos oficiales ${brand.name}.`}
        breadcrumbs={[
          { name: "Inicio", href: "/" },
          { name: "Marcas", href: "/marcas" },
          { name: brand.name, href: `/marcas/${brand.slug}` },
        ]}
        basePath={`/marcas/${brand.slug}`}
        searchParams={await searchParams}
        scope={{ brandSlugs: [brand.slug] }}
        hideBrandFilter
      />
    </PageTransition>
  );
}
