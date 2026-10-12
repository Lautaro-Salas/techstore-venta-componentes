"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { AddressFields } from "@/features/checkout/steps/address-fields";
import type { SavedAddress } from "@/features/checkout/types";
import { useFormAction } from "@/hooks/use-form-action";
import type { AddressInput } from "@/schemas/customer";
import { deleteAddressAction, saveAddressAction, setDefaultAddressAction } from "./actions";

function AddressForm({ initial, onDone }: { initial: SavedAddress | null; onDone: () => void }) {
  const [value, setValue] = useState<Partial<AddressInput>>(initial ?? {});
  const { state, pending, onSubmit, errors } = useFormAction(saveAddressAction);
  const toast = useToast();
  useEffect(() => {
    if (state.ok === true) {
      toast.success("Dirección guardada");
      onDone();
    }
  }, [state, toast, onDone]);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {initial && <input type="hidden" name="addressId" value={initial.id} />}
      {Object.entries(value).map(([k, v]) => (typeof v === "string" ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <Input label="Nombre de la dirección (opcional)" placeholder="Casa, Trabajo…" value={value.label ?? ""} onChange={(e) => setValue({ ...value, label: e.target.value })} />
      <AddressFields value={value} onChange={setValue} errors={errors} />
      {state.ok === false && !state.fieldErrors && <p className="text-sm font-medium text-danger" role="alert">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>Cancelar</Button>
        <Button type="submit" loading={pending}>Guardar dirección</Button>
      </div>
    </form>
  );
}

export function AddressManager({ addresses }: { addresses: SavedAddress[] }) {
  const [editing, setEditing] = useState<SavedAddress | null | "new">(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const close = useCallback(() => setEditing(null), []);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    startTransition(async () => {
      const result = await fn();
      if (result.ok) toast.success(success);
      else toast.error("No pudimos completar la acción", result.error);
    });

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Direcciones</h1>
        <Button onClick={() => setEditing("new")} icon={<Plus className="size-4" aria-hidden />}>Agregar</Button>
      </div>
      {addresses.length === 0 ? (
        <EmptyState icon={<MapPin />} title="No tenés direcciones guardadas" description="Guardá una dirección para comprar más rápido." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2" aria-busy={pending}>
          {addresses.map((a) => (
            <li key={a.id} className="card flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{a.label || a.recipientName}</span>
                {a.isDefault && <Badge tone="primary">Predeterminada</Badge>}
              </div>
              <p className="text-sm text-muted">
                {a.recipientName} · {a.phone}<br />
                {a.street} {a.number}{a.floor ? `, piso ${a.floor}` : ""}{a.apartment ? ` ${a.apartment}` : ""}<br />
                {a.city}, {a.province} ({a.postalCode})
              </p>
              <div className="mt-auto flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(a)} icon={<Pencil className="size-3.5" aria-hidden />}>Editar</Button>
                {!a.isDefault && <Button size="sm" variant="ghost" onClick={() => run(() => setDefaultAddressAction(a.id), "Dirección predeterminada actualizada")} icon={<Star className="size-3.5" aria-hidden />}>Predeterminar</Button>}
                <Button size="sm" variant="ghost" className="text-danger" onClick={() => run(() => deleteAddressAction(a.id), "Dirección eliminada")} icon={<Trash2 className="size-3.5" aria-hidden />}>Eliminar</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal open={editing !== null} onClose={close} title={editing === "new" ? "Nueva dirección" : "Editar dirección"} className="max-w-2xl">
        {editing !== null && <AddressForm initial={editing === "new" ? null : editing} onDone={close} />}
      </Modal>
    </>
  );
}
