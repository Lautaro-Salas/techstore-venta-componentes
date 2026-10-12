import { notFound, permanentRedirect } from "next/navigation";
import { findCategoryBySlug } from "@/services/catalog/categories.service";

/** Alias /productos/placas-de-video → URL canónica jerárquica (/componentes/placas-de-video). */
export default async function ProductsCategoryAlias({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await findCategoryBySlug(slug);
  if (!category) notFound();
  permanentRedirect(category.href);
}
