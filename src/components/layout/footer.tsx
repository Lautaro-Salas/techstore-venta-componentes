import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { StoreSettings } from "@/schemas/settings";
import { WHATSAPP_DEFAULT_MESSAGE, whatsappLink } from "@/lib/whatsapp";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter-form";

interface FooterProps {
  settings: StoreSettings;
  paymentMethods: string[];
  shippingMethods: string[];
}

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Comprar",
    links: [
      { label: "Componentes", href: "/componentes" },
      { label: "Periféricos", href: "/perifericos" },
      { label: "Monitores", href: "/monitores" },
      { label: "Ofertas", href: "/ofertas" },
      { label: "Marcas", href: "/marcas" },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { label: "Contacto", href: "/contacto" },
      { label: "Preguntas frecuentes", href: "/faq" },
      { label: "Envíos", href: "/legales/envios" },
      { label: "Garantía", href: "/legales/garantia" },
      { label: "Cambios", href: "/legales/cambios" },
      { label: "Devoluciones", href: "/legales/devoluciones" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Nosotros", href: "/nosotros" },
      { label: "Términos y condiciones", href: "/legales/terminos" },
      { label: "Política de privacidad", href: "/legales/privacidad" },
      { label: "Contacto", href: "/contacto" },
    ],
  },
];

const SOCIAL_LABELS = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
} as const;

function ContactColumn({ settings }: { settings: StoreSettings }) {
  const wa = whatsappLink(settings.whatsapp, `${WHATSAPP_DEFAULT_MESSAGE}una consulta`);
  return (
    <div>
      <h2 className="text-sm font-semibold">Contacto</h2>
      <ul className="text-muted mt-4 space-y-3 text-sm">
        {wa && (
          <li>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground flex items-center gap-2"
            >
              <MessageCircle className="size-4" aria-hidden /> WhatsApp
            </a>
          </li>
        )}
        {settings.email && (
          <li>
            <a
              href={`mailto:${settings.email}`}
              className="hover:text-foreground flex items-center gap-2 break-all"
            >
              <Mail className="size-4 shrink-0" aria-hidden /> {settings.email}
            </a>
          </li>
        )}
        {settings.phone && (
          <li>
            <a
              href={`tel:${settings.phone.replace(/\s/g, "")}`}
              className="hover:text-foreground flex items-center gap-2"
            >
              <Phone className="size-4" aria-hidden /> {settings.phone}
            </a>
          </li>
        )}
        {settings.businessHours && (
          <li className="flex items-start gap-2">
            <Clock className="mt-0.5 size-4 shrink-0" aria-hidden /> {settings.businessHours}
          </li>
        )}
        {settings.address && (
          <li className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden /> {settings.address}
          </li>
        )}
        <li>
          <Link href="/contacto" className="text-primary font-medium hover:underline">
            Escribinos →
          </Link>
        </li>
      </ul>
    </div>
  );
}

export function Footer({ settings, paymentMethods, shippingMethods }: FooterProps) {
  const socials = (Object.keys(SOCIAL_LABELS) as (keyof typeof SOCIAL_LABELS)[]).filter(
    (k) => settings.social[k],
  );
  const wa = whatsappLink(settings.whatsapp, `${WHATSAPP_DEFAULT_MESSAGE}una consulta`);
  return (
    <footer className="border-border bg-surface mt-16 border-t pb-24 lg:pb-0">
      <div className="container-page border-border grid gap-8 border-b py-12 md:grid-cols-2 md:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Ofertas exclusivas en tu email</h2>
          <p className="text-muted mt-1.5 text-sm">
            Lanzamientos, bajas de precio y promociones. Sin spam.
          </p>
        </div>
        <div className="md:justify-self-end">
          <NewsletterForm />
        </div>
      </div>
      <div className="container-page grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <Logo name={settings.name} logoUrl={settings.logoUrl || undefined} />
          {settings.tagline && (
            <p className="text-muted mt-3 text-sm leading-relaxed">{settings.tagline}</p>
          )}
          {(socials.length > 0 || wa) && (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Redes sociales">
              {socials.map((key) => (
                <li key={key}>
                  <a
                    href={settings.social[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-border hover:border-primary/40 hover:bg-primary-soft hover:text-primary inline-flex rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors"
                  >
                    {SOCIAL_LABELS[key]}
                  </a>
                </li>
              ))}
              {wa && (
                <li>
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-border hover:border-primary/40 hover:bg-primary-soft hover:text-primary inline-flex rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors"
                  >
                    WhatsApp
                  </a>
                </li>
              )}
            </ul>
          )}
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="text-sm font-semibold">{col.title}</h2>
            <ul className="text-muted mt-4 space-y-2.5 text-sm">
              {col.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <ContactColumn settings={settings} />
      </div>
      <div className="container-page border-border grid gap-6 border-t py-8 text-sm md:grid-cols-2">
        <div>
          <h2 className="text-muted text-xs font-semibold tracking-wide uppercase">
            Medios de pago
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {paymentMethods.map((m) => (
              <li
                key={m}
                className="border-border bg-surface-2 rounded-lg border px-3 py-1.5 text-xs font-medium"
              >
                {m}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-muted text-xs font-semibold tracking-wide uppercase">
            Métodos de envío
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {shippingMethods.map((m) => (
              <li
                key={m}
                className="border-border bg-surface-2 rounded-lg border px-3 py-1.5 text-xs font-medium"
              >
                {m}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-border border-t">
        <p className="container-page text-muted py-5 text-xs">
          © {new Date().getFullYear()} {settings.name}. Precios en pesos argentinos (ARS) con IVA
          incluido. Las imágenes son ilustrativas.
        </p>
      </div>
    </footer>
  );
}
