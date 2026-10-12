import type { Metadata } from "next";
import Link from "next/link";
import { PageTransition } from "@/components/navigation/page-transition";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import { pluralize } from "@/lib/format";

export const metadata: Metadata = {
  title: "Marcas",
  description: "Todas las marcas oficiales disponibles en la tienda.",
  alternates: { canonical: "/marcas" },
};

export default async function BrandsPage() {
  const brands = await db.brand.findMany({
    orderBy: { name: "asc" },
    select: {
      name: true,
      slug: true,
      _count: { select: { products: { where: { status: "ACTIVE" } } } },
    },
  });
  const withProducts = brands.filter((b) => b._count.products > 0);
  return (
    <PageTransition>
      <div className="container-page py-6 sm:py-8">
        <Breadcrumb
          items={[
            { name: "Inicio", href: "/" },
            { name: "Marcas", href: "/marcas" },
          ]}
        />
        <h1 className="mt-4 mb-6 text-2xl font-bold tracking-tight sm:text-3xl">Marcas</h1>
        {withProducts.length === 0 ? (
          <EmptyState title="Todavía no hay marcas con productos publicados." />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {withProducts.map((b) => (
              <li key={b.slug}>
                <Link
                  href={`/marcas/${b.slug}`}
                  className="card hover:border-primary/40 flex h-full flex-col gap-1 p-5 transition-all hover:-translate-y-0.5"
                >
                  <span className="text-lg font-bold">{b.name}</span>
                  <span className="text-muted text-xs">
                    {pluralize(b._count.products, "producto", "productos")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageTransition>
  );
}
