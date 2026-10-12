"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Checkbox, Input } from "@/components/ui/field";
import { MAX_SPECS } from "@/schemas/admin";
import type { ProductSectionProps } from "./product-form-values";

type Spec = ProductSectionProps["values"]["specifications"][number];

const EMPTY_SPEC: Spec = { group: "General", key: "", label: "", value: "", filterable: false };

export function ProductSpecsEditor({ values, set, errors }: ProductSectionProps) {
  const specs = values.specifications;
  const update = (index: number, patch: Partial<Spec>) => set("specifications", specs.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  const err = (index: number, field: keyof Spec) => errors[`specifications.${index}.${field}`];

  return (
    <Card>
      <CardHeader
        title="Especificaciones"
        description="La clave técnica (ej. socket, memory_type) se usa para filtros y compatibilidad."
        action={
          <Button variant="outline" size="sm" onClick={() => set("specifications", [...specs, EMPTY_SPEC])} disabled={specs.length >= MAX_SPECS} icon={<Plus className="size-4" aria-hidden />}>
            Agregar
          </Button>
        }
      />
      <CardBody>
        {specs.length === 0 ? (
          <p className="text-sm text-muted">Sin especificaciones. Agregá filas con “Agregar”.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {specs.map((spec, i) => (
              <li key={i} className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.4fr_auto_auto] xl:items-end">
                <Input label="Grupo" value={spec.group} onChange={(e) => update(i, { group: e.target.value })} error={err(i, "group")} maxLength={60} />
                <Input label="Clave técnica" value={spec.key} onChange={(e) => update(i, { key: e.target.value })} error={err(i, "key")} maxLength={60} placeholder="socket" />
                <Input label="Etiqueta" value={spec.label} onChange={(e) => update(i, { label: e.target.value })} error={err(i, "label")} maxLength={80} placeholder="Socket" />
                <Input label="Valor" value={spec.value} onChange={(e) => update(i, { value: e.target.value })} error={err(i, "value")} maxLength={200} placeholder="AM5" />
                <Checkbox label="Filtrable" checked={spec.filterable} onChange={(e) => update(i, { filterable: e.target.checked })} className="xl:mb-3" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => set("specifications", specs.filter((_, j) => j !== i))}
                  aria-label={`Quitar especificación ${spec.label || i + 1}`}
                  className="text-danger"
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}
