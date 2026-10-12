import type { SpecificationData } from "@/types/catalog";

interface ExtraRow {
  label: string;
  value: string;
}

/** Tabla de especificaciones agrupada; las filas dependen de cada producto. */
export function ProductSpecifications({ specs, extra = [] }: { specs: SpecificationData[]; extra?: ExtraRow[] }) {
  const groups = new Map<string, ExtraRow[]>();
  for (const s of specs) {
    const rows = groups.get(s.group) ?? [];
    rows.push({ label: s.label, value: s.value });
    groups.set(s.group, rows);
  }
  if (extra.length) groups.set("Otros datos", [...(groups.get("Otros datos") ?? []), ...extra]);

  if (groups.size === 0) return <p className="text-sm text-muted">Este producto todavía no tiene especificaciones cargadas.</p>;

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full text-sm">
        <caption className="sr-only">Especificaciones técnicas</caption>
        <thead className="bg-surface-2 text-left">
          <tr>
            <th scope="col" className="w-2/5 px-4 py-3 font-semibold">Especificación</th>
            <th scope="col" className="px-4 py-3 font-semibold">Detalle</th>
          </tr>
        </thead>
        {[...groups.entries()].map(([group, rows]) => (
          <tbody key={group} className="divide-y divide-border border-t border-border">
            <tr className="bg-surface-2/50">
              <th scope="colgroup" colSpan={2} className="px-4 py-2 text-left text-xs font-semibold tracking-wide text-muted uppercase">{group}</th>
            </tr>
            {rows.map((row) => (
              <tr key={group + row.label} className="bg-surface">
                <th scope="row" className="px-4 py-2.5 text-left font-normal text-muted">{row.label}</th>
                <td className="px-4 py-2.5 font-medium">{row.value}</td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
