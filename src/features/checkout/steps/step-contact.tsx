"use client";

import Link from "next/link";
import { Input, Select } from "@/components/ui/field";
import type { ContactStepInput } from "@/schemas/checkout";

interface Props {
  value: Partial<ContactStepInput>;
  errors: Record<string, string>;
  onChange: (value: Partial<ContactStepInput>) => void;
  isAuthenticated: boolean;
  invoiceAEnabled: boolean;
}

export function StepContact({ value, errors, onChange, isAuthenticated, invoiceAEnabled }: Props) {
  const set = (key: keyof ContactStepInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...value, [key]: e.target.value });
  const isA = value.invoiceType === "FACTURA_A";
  return (
    <div className="flex flex-col gap-4">
      {!isAuthenticated && (
        <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted">
          ¿Ya tenés cuenta? <Link href="/ingresar?next=/checkout" className="font-medium text-primary hover:underline">Ingresá</Link> para completar tus datos más rápido. También podés comprar como invitado.
        </p>
      )}
      <Input label="Email" type="email" autoComplete="email" required value={value.email ?? ""} onChange={set("email")} error={errors.email} hint="Te enviaremos la confirmación del pedido." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nombre" autoComplete="given-name" required value={value.firstName ?? ""} onChange={set("firstName")} error={errors.firstName} />
        <Input label="Apellido" autoComplete="family-name" required value={value.lastName ?? ""} onChange={set("lastName")} error={errors.lastName} />
      </div>
      <Input label="Teléfono" type="tel" autoComplete="tel" inputMode="tel" required placeholder="11 2345 6789" value={value.phone ?? ""} onChange={set("phone")} error={errors.phone} />
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <Select label="Documento" required value={value.documentType ?? "DNI"} onChange={set("documentType")} error={errors.documentType} options={[{ value: "DNI", label: "DNI" }, { value: "CUIT", label: "CUIT" }, { value: "CUIL", label: "CUIL" }]} />
        <Input label="Número" inputMode="numeric" required value={value.documentNumber ?? ""} onChange={set("documentNumber")} error={errors.documentNumber} hint="Necesario para emitir la factura." />
      </div>
      {invoiceAEnabled && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-medium">Facturación</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {([["CONSUMIDOR_FINAL", "Consumidor final (Factura B)"], ["FACTURA_A", "Responsable inscripto (Factura A)"]] as const).map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border p-3 text-sm has-checked:border-primary has-checked:bg-primary-soft">
                <input type="radio" name="invoiceType" value={key} checked={(value.invoiceType ?? "CONSUMIDOR_FINAL") === key} onChange={set("invoiceType")} className="accent-[var(--primary)]" />
                {label}
              </label>
            ))}
          </div>
          {isA && <Input label="Razón social" required value={value.businessName ?? ""} onChange={set("businessName")} error={errors.businessName} />}
        </fieldset>
      )}
    </div>
  );
}
