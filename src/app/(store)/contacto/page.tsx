import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Clock, Headset, Mail, MapPin, MessageCircle, Phone, type LucideIcon } from "lucide-react";
import { PageTransition } from "@/components/navigation/page-transition";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ContactForm } from "@/features/contact/contact-form";
import { WHATSAPP_DEFAULT_MESSAGE, whatsappLink } from "@/lib/whatsapp";
import { getStoreSettings } from "@/services/settings/settings.service";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escribinos por consultas sobre productos, pedidos, garantías o devoluciones.",
  alternates: { canonical: "/contacto" },
};

interface ChannelCardProps {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}

function ChannelCard({ icon: Icon, title, children }: ChannelCardProps) {
  return (
    <li className="card flex items-start gap-4 p-5">
      <span className="bg-primary-soft text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 text-sm">
        <h2 className="font-semibold">{title}</h2>
        <div className="text-muted mt-1">{children}</div>
      </div>
    </li>
  );
}

const LINK_CLASS = "font-medium break-all text-primary hover:underline";

export default async function ContactPage() {
  const settings = await getStoreSettings();
  const wa = whatsappLink(settings.whatsapp, `${WHATSAPP_DEFAULT_MESSAGE}una consulta`);
  const hasChannels = Boolean(
    wa || settings.email || settings.phone || settings.address || settings.businessHours,
  );

  return (
    <PageTransition>
      <div className="container-page py-6 sm:py-8">
        <Breadcrumb
          items={[
            { name: "Inicio", href: "/" },
            { name: "Contacto", href: "/contacto" },
          ]}
        />
        <header className="mt-4 mb-8 max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Contacto</h1>
          <p className="text-muted mt-2">
            ¿Tenés una duda sobre un producto, tu pedido o una garantía? Escribinos y te ayudamos.
            Antes de consultar, podés revisar las{" "}
            <Link href="/faq" className="text-primary font-medium hover:underline">
              preguntas frecuentes
            </Link>
            .
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
          <section aria-labelledby="channels-title">
            <h2 id="channels-title" className="sr-only">
              Canales de atención
            </h2>
            <ul className="flex flex-col gap-3">
              <ChannelCard icon={Headset} title="Atención al cliente">
                {settings.businessHours ? (
                  <>
                    Respondemos consultas en nuestro horario de atención: {settings.businessHours}.
                  </>
                ) : (
                  <>Respondemos todas las consultas por orden de llegada, lo antes posible.</>
                )}
              </ChannelCard>
              {wa && (
                <ChannelCard icon={MessageCircle} title="WhatsApp">
                  <a href={wa} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
                    Escribinos por WhatsApp
                  </a>
                </ChannelCard>
              )}
              {settings.email && (
                <ChannelCard icon={Mail} title="Email">
                  <a href={`mailto:${settings.email}`} className={LINK_CLASS}>
                    {settings.email}
                  </a>
                </ChannelCard>
              )}
              {settings.phone && (
                <ChannelCard icon={Phone} title="Teléfono">
                  <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className={LINK_CLASS}>
                    {settings.phone}
                  </a>
                </ChannelCard>
              )}
              {settings.businessHours && (
                <ChannelCard icon={Clock} title="Horarios">
                  {settings.businessHours}
                </ChannelCard>
              )}
              {settings.address && (
                <ChannelCard icon={MapPin} title="Dirección">
                  {settings.address}
                </ChannelCard>
              )}
            </ul>
            {!hasChannels && (
              <p className="text-muted mt-3 text-sm">
                Por el momento atendemos consultas a través del formulario de contacto.
              </p>
            )}
          </section>

          <section aria-labelledby="form-title" className="card p-5 sm:p-7">
            <h2 id="form-title" className="text-lg font-semibold">
              Envianos tu consulta
            </h2>
            <p className="text-muted mt-1 mb-6 text-sm">
              Los campos marcados con * son obligatorios.
            </p>
            <ContactForm />
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
