import Link from "next/link";
import type { Metadata } from "next";
import { CategoryTiles } from "@/components/home/category-tiles";
import { Hero } from "@/components/home/hero";
import { Section } from "@/components/home/section";
import { TrustStrip } from "@/components/home/trust-strip";
import { PageTransition } from "@/components/navigation/page-transition";
import { ProductRow } from "@/components/product/product-grid";
import { RecentlyViewed } from "@/features/recently-viewed/recently-viewed";
import { db } from "@/lib/db";
import { getEnvSiteUrl, jsonLd } from "@/lib/site";
import { flattenTree, getCategoryTree } from "@/services/catalog/categories.service";
import { getHomeSections } from "@/services/catalog/products.service";
import { getInterestFreeHint } from "@/services/pricing/installments.service";
import { getStoreSettings } from "@/services/settings/settings.service";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  // El openGraph de la página reemplaza al del layout entero: hay que incluir
  // la imagen (src/app/opengraph-image.png) si no se quiere perder el og:image.
  openGraph: {
    url: "/",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Tienda de tecnología en Argentina",
      },
    ],
  },
};

export default async function HomePage() {
  const [settings, tree, sections, installments, brands] = await Promise.all([
    getStoreSettings(),
    getCategoryTree(),
    getHomeSections(),
    getInterestFreeHint(),
    db.brand.findMany({
      where: { products: { some: { status: "ACTIVE" } } },
      orderBy: { name: "asc" },
      select: { name: true, slug: true },
    }),
  ]);
  const leafCategories = flattenTree(tree).filter((c) => c.children.length === 0);
  const organization = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: settings.name,
    url: getEnvSiteUrl(),
    ...(settings.email ? { email: settings.email } : {}),
    ...(settings.phone ? { telephone: settings.phone } : {}),
    currenciesAccepted: "ARS",
    potentialAction: {
      "@type": "SearchAction",
      target: `${getEnvSiteUrl()}/productos?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <PageTransition>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(organization) }}
      />
      <Hero storeName={settings.name} />
      <Section title="Explorá por categoría">
        <CategoryTiles categories={leafCategories} />
      </Section>
      {sections.offers.length > 0 && (
        <Section
          title="Ofertas destacadas"
          subtitle="Precios rebajados con stock disponible"
          href="/ofertas"
        >
          <ProductRow products={sections.offers} installments={installments} />
        </Section>
      )}
      <TrustStrip />
      {sections.bestSellers.length > 0 && (
        <Section title="Los más vendidos" href="/productos?orden=best_selling">
          <ProductRow products={sections.bestSellers} installments={installments} />
        </Section>
      )}
      {sections.newArrivals.length > 0 && (
        <Section title="Recién llegados" href="/productos?orden=newest">
          <ProductRow products={sections.newArrivals} installments={installments} />
        </Section>
      )}
      <RecentlyViewed />
      {brands.length > 0 && (
        <Section title="Marcas oficiales" href="/marcas" linkLabel="Todas las marcas">
          <ul className="flex flex-wrap gap-2">
            {brands.map((b) => (
              <li key={b.slug}>
                <Link
                  href={`/marcas/${b.slug}`}
                  className="border-border bg-surface text-muted hover:border-primary/50 hover:text-primary hover:bg-primary-soft inline-flex rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </PageTransition>
  );
}
