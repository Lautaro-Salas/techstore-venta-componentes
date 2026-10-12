import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WINDOW = 1;

function pageList(current: number, total: number): (number | "…")[] {
  const pages: (number | "…")[] = [];
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || Math.abs(p - current) <= WINDOW) pages.push(p);
    else if (pages.at(-1) !== "…") pages.push("…");
  }
  return pages;
}

/** Paginación con links reales (SEO-friendly). `hrefFor` arma la URL de cada página. */
export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const base =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-border px-3 text-sm";
  return (
    <nav aria-label="Paginación" className="flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className={cn(base, "hover:bg-surface-2")}
          aria-label="Página anterior"
          rel="prev"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={cn(base, "opacity-40")} aria-hidden>
          <ChevronLeft className="size-4" />
        </span>
      )}
      {pageList(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="text-muted px-1">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              base,
              p === page
                ? "bg-cta border-primary text-primary-foreground shadow-primary/20 shadow-sm"
                : "hover:bg-surface-2",
            )}
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          className={cn(base, "hover:bg-surface-2")}
          aria-label="Página siguiente"
          rel="next"
        >
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={cn(base, "opacity-40")} aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
