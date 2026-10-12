import { CreditCard, Headset, Lock, ShieldCheck, Truck } from "lucide-react";

const ITEMS = [
  { Icon: Truck, title: "Envíos a todo el país", text: "Domicilio o retiro en local" },
  {
    Icon: CreditCard,
    title: "Cuotas y transferencia",
    text: "Descuento pagando por transferencia",
  },
  { Icon: ShieldCheck, title: "Garantía oficial", text: "Productos nuevos con factura" },
  { Icon: Lock, title: "Compra segura", text: "Datos protegidos" },
  { Icon: Headset, title: "Asesoramiento real", text: "Te ayudamos a elegir" },
];

export function TrustStrip() {
  return (
    <section aria-label="Beneficios" className="container-page mt-14 sm:mt-20">
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {ITEMS.map(({ Icon, title, text }) => (
          <li
            key={title}
            className="card hover:border-primary/30 flex items-start gap-3 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="bg-cta-soft text-primary ring-primary/20 grid size-9 shrink-0 place-items-center rounded-xl ring-1">
              <Icon className="size-4.5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-muted mt-0.5 text-xs">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
