import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Section({
  title,
  subtitle,
  href,
  linkLabel = "Ver todo",
  children,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="container-page mt-14 sm:mt-20">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-balance sm:text-2xl">{title}</h2>
          {subtitle && <p className="text-muted mt-1.5 text-sm">{subtitle}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="group text-primary hover:text-primary-hover flex shrink-0 items-center gap-1.5 text-sm font-medium transition-colors"
          >
            {linkLabel}
            <ArrowRight
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
