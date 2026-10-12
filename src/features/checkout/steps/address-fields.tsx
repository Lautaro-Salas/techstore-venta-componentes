"use client";

import { Input, Select } from "@/components/ui/field";
import { PROVINCES } from "@/lib/argentina";
import type { AddressInput } from "@/schemas/customer";

interface Props {
  value: Partial<AddressInput>;
  errors: Record<string, string>;
  onChange: (value: Partial<AddressInput>) => void;
  /** Prefijo de la clave de error (ej. "address."). */
  errorPrefix?: string;
}

/** Campos de dirección argentina reutilizados en checkout y en "Mis direcciones". */
export function AddressFields({ value, errors, onChange, errorPrefix = "" }: Props) {
  const set = (key: keyof AddressInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...value, [key]: e.target.value });
  const err = (key: string) => errors[`${errorPrefix}${key}`];
  return (
    <div className="grid gap-4 sm:grid-cols-6">
      <Input containerClassName="sm:col-span-6" label="Nombre y apellido de quien recibe" autoComplete="name" required value={value.recipientName ?? ""} onChange={set("recipientName")} error={err("recipientName")} />
      <Input containerClassName="sm:col-span-4" label="Calle" autoComplete="address-line1" required value={value.street ?? ""} onChange={set("street")} error={err("street")} />
      <Input containerClassName="sm:col-span-2" label="Altura" inputMode="numeric" required value={value.number ?? ""} onChange={set("number")} error={err("number")} />
      <Input containerClassName="sm:col-span-2" label="Piso" value={value.floor ?? ""} onChange={set("floor")} error={err("floor")} />
      <Input containerClassName="sm:col-span-2" label="Depto." value={value.apartment ?? ""} onChange={set("apartment")} error={err("apartment")} />
      <Input containerClassName="sm:col-span-2" label="Código postal" autoComplete="postal-code" required placeholder="1425" value={value.postalCode ?? ""} onChange={set("postalCode")} error={err("postalCode")} />
      <Input containerClassName="sm:col-span-3" label="Localidad" autoComplete="address-level2" required value={value.city ?? ""} onChange={set("city")} error={err("city")} />
      <Select containerClassName="sm:col-span-3" label="Provincia" required value={value.province ?? ""} onChange={set("province")} error={err("province")} placeholder="Elegí una provincia" options={PROVINCES.map((p) => ({ value: p, label: p }))} />
      <Input containerClassName="sm:col-span-3" label="Teléfono de contacto" type="tel" autoComplete="tel" required value={value.phone ?? ""} onChange={set("phone")} error={err("phone")} />
      <Input containerClassName="sm:col-span-3" label="Indicaciones (opcional)" placeholder="Timbre, horarios, referencias" value={value.notes ?? ""} onChange={set("notes")} error={err("notes")} />
    </div>
  );
}
