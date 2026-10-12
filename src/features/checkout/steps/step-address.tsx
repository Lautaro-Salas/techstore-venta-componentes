"use client";

import { Home, Store } from "lucide-react";
import { Checkbox } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { AddressInput } from "@/schemas/customer";
import type { DeliveryMode, SavedAddress } from "../types";
import { AddressFields } from "./address-fields";

interface Props {
  mode: DeliveryMode;
  onModeChange: (mode: DeliveryMode) => void;
  pickupAvailable: boolean;
  homeAvailable: boolean;
  saved: SavedAddress[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  address: Partial<AddressInput>;
  onAddressChange: (value: Partial<AddressInput>) => void;
  saveAddress: boolean;
  onSaveAddressChange: (value: boolean) => void;
  isAuthenticated: boolean;
  errors: Record<string, string>;
}

function formatAddress(a: SavedAddress) {
  return `${a.street} ${a.number}${a.floor ? `, piso ${a.floor}` : ""}${a.apartment ? ` ${a.apartment}` : ""} · ${a.city}, ${a.province} (${a.postalCode})`;
}

export function StepAddress(props: Props) {
  const { mode, saved, selectedId } = props;
  const option = "flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm transition-colors";
  return (
    <div className="flex flex-col gap-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">¿Cómo querés recibir tu compra?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {props.homeAvailable && (
            <label className={cn(option, mode === "HOME_DELIVERY" ? "border-primary bg-primary-soft" : "border-border")}>
              <input type="radio" name="deliveryMode" checked={mode === "HOME_DELIVERY"} onChange={() => props.onModeChange("HOME_DELIVERY")} className="mt-0.5 accent-[var(--primary)]" />
              <Home className="size-5 shrink-0 text-primary" aria-hidden />
              <span><strong className="block">Envío a domicilio</strong><span className="text-muted">A todo el país</span></span>
            </label>
          )}
          {props.pickupAvailable && (
            <label className={cn(option, mode === "PICKUP" ? "border-primary bg-primary-soft" : "border-border")}>
              <input type="radio" name="deliveryMode" checked={mode === "PICKUP"} onChange={() => props.onModeChange("PICKUP")} className="mt-0.5 accent-[var(--primary)]" />
              <Store className="size-5 shrink-0 text-primary" aria-hidden />
              <span><strong className="block">Retiro en local</strong><span className="text-muted">Sin costo de envío</span></span>
            </label>
          )}
        </div>
      </fieldset>

      {mode === "PICKUP" ? (
        <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted">No necesitás cargar una dirección. Te avisamos por email cuando el pedido esté listo para retirar.</p>
      ) : (
        <>
          {saved.length > 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">Tus direcciones</legend>
              {saved.map((a) => (
                <label key={a.id} className={cn(option, selectedId === a.id ? "border-primary bg-primary-soft" : "border-border")}>
                  <input type="radio" name="savedAddress" checked={selectedId === a.id} onChange={() => props.onSelect(a.id)} className="mt-0.5 accent-[var(--primary)]" />
                  <span><strong className="block">{a.label || a.recipientName}</strong><span className="text-muted">{formatAddress(a)}</span></span>
                </label>
              ))}
              <label className={cn(option, selectedId === null ? "border-primary bg-primary-soft" : "border-border")}>
                <input type="radio" name="savedAddress" checked={selectedId === null} onChange={() => props.onSelect(null)} className="mt-0.5 accent-[var(--primary)]" />
                <strong>Usar otra dirección</strong>
              </label>
            </fieldset>
          )}
          {selectedId === null && (
            <>
              <AddressFields value={props.address} onChange={props.onAddressChange} errors={props.errors} errorPrefix="address." />
              {props.isAuthenticated && <Checkbox label="Guardar esta dirección en mi cuenta" checked={props.saveAddress} onChange={(e) => props.onSaveAddressChange(e.target.checked)} />}
            </>
          )}
        </>
      )}
    </div>
  );
}
