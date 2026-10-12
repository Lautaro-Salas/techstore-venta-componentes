import type { Metadata } from "next";
import {
  Cpu,
  Headset,
  Keyboard,
  Monitor,
  PackageCheck,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { PageTransition } from "@/components/navigation/page-transition";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { getStoreSettings } from "@/services/settings/settings.service";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  return {
    title: "Nosotros",
    description: `Conocé ${settings.name}: componentes, periféricos y monitores con garantía oficial y asesoramiento.`,
    alternates: { canonical: "/nosotros" },
  };
}

interface Feature {
  icon: LucideIcon;
  title: string;
  text: string;
  href?: string;
}

const CATEGORIES: Feature[] = [
  {
    icon: Cpu,
    title: "Componentes",
    text: "Procesadores, placas madre, memorias, almacenamiento, placas de video, fuentes y gabinetes.",
    href: "/componentes",
  },
  {
    icon: Keyboard,
    title: "Periféricos",
    text: "Teclados, mouse, auriculares y accesorios para trabajar y jugar.",
    href: "/perifericos",
  },
  {
    icon: Monitor,
    title: "Monitores",
    text: "Monitores para oficina, diseño y gaming en distintos tamaños y frecuencias.",
    href: "/monitores",
  },
];

const REASONS: Feature[] = [
  {
    icon: ShieldCheck,
    title: "Garantía oficial",
    text: "Productos nuevos y originales, con la garantía oficial informada en cada ficha.",
  },
  {
    icon: Headset,
    title: "Asesoramiento",
    text: "Te ayudamos a elegir y a verificar la compatibilidad de tu equipo antes de comprar.",
  },
  {
    icon: PackageCheck,
    title: "Stock real",
    text: "El stock publicado se actualiza con cada venta, para que sepas qué está disponible.",
  },
  {
    icon: Truck,
    title: "Envíos a todo el país",
    text: "Envío a domicilio y, cuando está habilitado, retiro en local. Costos y plazos visibles en el checkout.",
  },
];

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <li className="card flex h-full flex-col gap-3 p-5">
      <span className="bg-primary-soft text-primary flex size-10 items-center justify-center rounded-xl">
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="font-semibold">{feature.title}</h3>
      <p className="text-muted text-sm">{feature.text}</p>
      {feature.href && (
        <ButtonLink href={feature.href} variant="link" size="sm" className="mt-auto self-start">
          Ver {feature.title.toLowerCase()}
        </ButtonLink>
      )}
    </li>
  );
}

export default async function AboutPage() {
  const settings = await getStoreSettings();
  return (
    <PageTransition>
      <div className="container-page py-6 sm:py-8">
        <Breadcrumb
          items={[
            { name: "Inicio", href: "/" },
            { name: "Nosotros", href: "/nosotros" },
          ]}
        />

        <header className="mt-4 max-w-3xl">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Sobre {settings.name}</h1>
          <p className="text-muted mt-3 text-lg">
            {(
              settings.tagline || "Componentes, periféricos y monitores con garantía oficial"
            ).replace(/\.$/, "")}
            .
          </p>
        </header>

        <section aria-labelledby="mission-title" className="card mt-8 max-w-3xl p-6 sm:p-8">
          <h2 id="mission-title" className="text-lg font-semibold">
            Nuestra misión
          </h2>
          <p className="text-muted mt-2 leading-relaxed">
            En {settings.name} queremos que comprar tecnología sea simple y confiable: información
            clara de cada producto, precios en pesos con IVA incluido, atención por personas que
            conocen lo que venden y un servicio de postventa que responde cuando lo necesitás.
          </p>
        </section>

        <section aria-labelledby="catalog-title" className="mt-12">
          <h2 id="catalog-title" className="mb-4 text-xl font-semibold">
            Qué vendemos
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((f) => (
              <FeatureCard key={f.title} feature={f} />
            ))}
          </ul>
        </section>

        <section aria-labelledby="why-title" className="mt-12">
          <h2 id="why-title" className="mb-4 text-xl font-semibold">
            Por qué comprarnos
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {REASONS.map((f) => (
              <FeatureCard key={f.title} feature={f} />
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="cta-title"
          className="card mt-12 flex flex-col items-start gap-4 p-6 sm:p-8 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h2 id="cta-title" className="text-lg font-semibold">
              ¿Buscás algo en particular?
            </h2>
            <p className="text-muted mt-1 text-sm">
              Recorré el catálogo o escribinos y te asesoramos.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <ButtonLink href="/productos">Ver catálogo</ButtonLink>
            <ButtonLink href="/contacto" variant="outline">
              Contactanos
            </ButtonLink>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
