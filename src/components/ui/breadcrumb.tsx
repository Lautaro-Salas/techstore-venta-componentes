import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { BreadcrumbItem } from "@/types/catalog";
import { getEnvSiteUrl, jsonLd as toJsonLd } from "@/lib/site";

/** Migas de pan con datos estructurados BreadcrumbList (Schema.org). */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const siteUrl = getEnvSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.href}`,
    })),
  };
  return (
    <nav aria-label="Ubicación" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1 text-muted">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-1">
              {last ? (
                <span aria-current="page" className="line-clamp-1 font-medium text-foreground">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link href={item.href} className="hover:text-foreground hover:underline">
                    {item.name}
                  </Link>
                  <ChevronRight className="size-3.5" aria-hidden />
                </>
              )}
            </li>
          );
        })}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(data) }} />
    </nav>
  );
}
