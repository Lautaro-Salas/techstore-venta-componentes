import type { Metadata } from "next";
import { ChevronDown, MessageSquare } from "lucide-react";
import { PageTransition } from "@/components/navigation/page-transition";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { FAQ_CATEGORIES, type FaqCategory, type FaqItem } from "@/features/faq/faq-content";
import { jsonLd } from "@/lib/site";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Respuestas sobre compras, pagos, envíos, garantías, devoluciones, productos y tu cuenta.",
  alternates: { canonical: "/faq" },
};

function FaqAccordionItem({ item }: { item: FaqItem }) {
  return (
    <details className="group border-border border-b last:border-b-0">
      <summary className="hover:bg-surface-2 flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium transition-colors [&::-webkit-details-marker]:hidden">
        <span>{item.question}</span>
        <ChevronDown
          className="text-muted size-5 shrink-0 transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <p className="text-muted px-5 pb-5 text-sm leading-relaxed">{item.answer}</p>
    </details>
  );
}

function FaqSection({ category }: { category: FaqCategory }) {
  return (
    <section id={category.id} aria-labelledby={`${category.id}-title`} className="scroll-mt-28">
      <h2 id={`${category.id}-title`} className="mb-3 text-lg font-semibold">
        {category.title}
      </h2>
      <div className="card overflow-hidden">
        {category.items.map((item) => (
          <FaqAccordionItem key={item.question} item={item} />
        ))}
      </div>
    </section>
  );
}

function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_CATEGORIES.flatMap((c) => c.items).map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export default function FaqPage() {
  return (
    <PageTransition>
      <div className="container-page py-6 sm:py-8">
        <Breadcrumb
          items={[
            { name: "Inicio", href: "/" },
            { name: "Preguntas frecuentes", href: "/faq" },
          ]}
        />
        <header className="mt-4 mb-6 max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Preguntas frecuentes</h1>
          <p className="text-muted mt-2">
            Encontrá respuestas rápidas sobre cómo comprar, pagar, recibir tu pedido y usar la
            garantía.
          </p>
        </header>

        <nav aria-label="Categorías de preguntas" className="mb-8">
          <ul className="flex flex-wrap gap-2">
            {FAQ_CATEGORIES.map((c) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  className="border-border bg-surface hover:border-primary/40 hover:bg-primary-soft hover:text-primary inline-flex rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
                >
                  {c.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex max-w-3xl flex-col gap-10">
          {FAQ_CATEGORIES.map((c) => (
            <FaqSection key={c.id} category={c} />
          ))}
        </div>

        <aside className="card mt-12 flex max-w-3xl flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">¿No encontraste lo que buscabas?</h2>
            <p className="text-muted mt-1 text-sm">Escribinos y te respondemos a la brevedad.</p>
          </div>
          <ButtonLink href="/contacto" icon={<MessageSquare className="size-4" aria-hidden />}>
            Contactanos
          </ButtonLink>
        </aside>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(faqJsonLd()) }}
        />
      </div>
    </PageTransition>
  );
}
