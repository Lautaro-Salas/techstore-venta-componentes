import { ArrowRight, Cpu, Monitor, Zap } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function Hero({ storeName }: { storeName: string }) {
  return (
    <section className="bg-hero border-border relative overflow-hidden border-b">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_82%_-10%,color-mix(in_oklab,var(--brand)_20%,transparent),transparent)]"
      />
      <div className="container-page relative grid items-center gap-10 py-14 md:py-20 lg:grid-cols-[1.2fr_1fr] lg:py-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
            <Zap
              className="size-3.5 text-[color-mix(in_oklab,var(--brand)_35%,white)]"
              aria-hidden
            />
            <span>Stock real</span>
            <span aria-hidden className="h-3 w-px bg-white/15" />
            <span>Factura A y B</span>
            <span aria-hidden className="h-3 w-px bg-white/15" />
            <span>Garantía oficial</span>
          </p>
          <h1 className="mt-5 text-4xl leading-[1.05] font-bold tracking-tight text-balance text-white sm:text-5xl lg:text-6xl">
            Armá el setup que querés, <span className="text-gradient">sin vueltas.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/75 sm:text-lg">
            Componentes, periféricos y monitores con compatibilidad verificada y envío a todo el
            país. En {storeName} te ayudamos a elegir bien.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/componentes" size="lg" icon={<Cpu className="size-5" aria-hidden />}>
              Ver componentes
            </ButtonLink>
            <ButtonLink
              href="/ofertas"
              size="lg"
              variant="outline"
              className="border-white/25 bg-white/10 text-white hover:bg-white/15"
            >
              Ofertas de la semana <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
        </div>
        <div className="hidden lg:block" aria-hidden>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Placas de video", sub: "RTX y Radeon", Icon: Zap },
              { label: "Procesadores", sub: "AM5, AM4, LGA1700", Icon: Cpu },
              { label: "Monitores", sub: "Hasta 240 Hz", Icon: Monitor },
              { label: "Compatibilidad", sub: "Verificada por specs", Icon: ArrowRight },
            ].map(({ label, sub, Icon }, i) => (
              <div
                key={label}
                className={`rounded-2xl border border-white/15 bg-white/[0.07] p-6 backdrop-blur-sm ${i % 2 === 1 ? "translate-y-6" : ""}`}
              >
                <Icon className="size-7 text-[color-mix(in_oklab,var(--brand)_35%,white)]" />
                <p className="mt-6 font-semibold text-white">{label}</p>
                <p className="mt-1 text-sm text-white/70">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
