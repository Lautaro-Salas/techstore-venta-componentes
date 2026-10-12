import { Gift, Truck } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Benefit } from "@/services/cart/rules";

/** "Te faltan $X para obtener <beneficio>" con barra de progreso. */
export function BenefitProgress({ benefits, subtotal }: { benefits: Benefit[]; subtotal: number }) {
  if (benefits.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {benefits.map((b) => {
        const target = subtotal + b.missingAmount;
        const pct = Math.min(Math.round((subtotal / target) * 100), 100);
        const Icon = b.label === "envío gratis" ? Truck : Gift;
        return (
          <li key={b.label} className="rounded-xl bg-primary-soft px-3.5 py-3">
            <p className="flex items-center gap-2 text-sm">
              <Icon className="size-4 shrink-0 text-primary" aria-hidden />
              <span>Te faltan <strong>{formatPrice(b.missingAmount)}</strong> para obtener <strong>{b.label}</strong></span>
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Progreso hacia ${b.label}`}>
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
