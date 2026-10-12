import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { PageTransition } from "@/components/navigation/page-transition";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  getLegalPage,
  isLegalSlug,
  LEGAL_NAV,
  type LegalSection,
  type LegalSlug,
} from "@/features/legal/legal-content";
import { cn } from "@/lib/utils";
import { getStoreSettings } from "@/services/settings/settings.service";

interface Props {
  params: Promise<{ slug: string }>;
}

async function loadPage(params: Props["params"]) {
  const { slug } = await params;
  if (!isLegalSlug(slug)) return null;
  const settings = await getStoreSettings();
  return getLegalPage(slug, settings.name);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await loadPage(params);
  if (!page) return { title: "Página no encontrada" };
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/legales/${page.slug}` },
  };
}

function LegalNav({ current }: { current: LegalSlug }) {
  return (
    <nav aria-label="Información legal" className="card p-2 lg:sticky lg:top-28">
      <ul className="flex flex-col">
        {LEGAL_NAV.map((item) => {
          const active = item.slug === current;
          return (
            <li key={item.slug}>
              <Link
                href={`/legales/${item.slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-xl px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary-soft text-primary font-semibold"
                    : "text-muted hover:bg-surface-2 hover:text-foreground",
                )}
              >
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ReferenceBanner() {
  return (
    <div
      className="border-warning/30 bg-warning-soft text-warning mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm"
      role="note"
    >
      <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
      <p className="font-medium">
        Contenido de referencia: reemplazar por el texto legal revisado por un profesional antes de
        publicar.
      </p>
    </div>
  );
}

function Section({ section }: { section: LegalSection }) {
  return (
    <section>
      <h2>{section.heading}</h2>
      {section.paragraphs?.map((p) => (
        <p key={p}>{p}</p>
      ))}
      {section.items && (
        <ul>
          {section.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function LegalPageRoute({ params }: Props) {
  const page = await loadPage(params);
  if (!page) notFound();
  return (
    <PageTransition key={page.slug}>
      <div className="container-page py-6 sm:py-8">
        <Breadcrumb
          items={[
            { name: "Inicio", href: "/" },
            { name: page.title, href: `/legales/${page.slug}` },
          ]}
        />
        <div className="mt-6 grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
          <aside className="order-last lg:order-first">
            <LegalNav current={page.slug} />
          </aside>
          <article className="card min-w-0 p-5 sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{page.title}</h1>
            <p className="text-muted mt-2 mb-6">{page.description}</p>
            <ReferenceBanner />
            <div className="prose-legal max-w-3xl">
              {page.sections.map((s) => (
                <Section key={s.heading} section={s} />
              ))}
            </div>
            <p className="border-border text-muted mt-10 border-t pt-6 text-sm">
              ¿Tenés dudas sobre esta información?{" "}
              <Link href="/contacto" className="text-primary font-medium hover:underline">
                Escribinos
              </Link>
              .
            </p>
          </article>
        </div>
      </div>
    </PageTransition>
  );
}
