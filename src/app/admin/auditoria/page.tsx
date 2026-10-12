import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { PageTransition } from "@/components/navigation/page-transition";
import { AdminTable, EmptyRow } from "@/components/admin/admin-table";
import { AUDIT_ACTION_LABEL, AUDIT_ENTITY_LABEL } from "@/components/admin/labels";
import {
  hrefWith,
  readPage,
  readParam,
  type AdminSearchParams,
} from "@/components/admin/query";
import { SearchForm } from "@/components/admin/search-form";
import { Pagination } from "@/components/ui/pagination";
import { formatDateTime } from "@/lib/format";
import { requirePermissionPage } from "@/lib/auth/guards";
import { AUDIT_ACTIONS, AUDIT_ENTITIES, listAuditLogs } from "@/services/admin/audit.service";

export const metadata: Metadata = { title: "Auditoría" };

const BASE = "/admin/auditoria";

const HEAD = [
  { label: "Fecha" },
  { label: "Acción" },
  { label: "Entidad" },
  { label: "Administrador" },
  { label: "Detalle" },
  { label: "IP", className: "text-right" },
];

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  await requirePermissionPage("settings:read", BASE);
  const sp = await searchParams;
  const filters = {
    q: readParam(sp, "q"),
    accion: readParam(sp, "accion"),
    entidad: readParam(sp, "entidad"),
  };
  const result = await listAuditLogs({
    q: filters.q,
    action: filters.accion || undefined,
    entity: filters.entidad || undefined,
    page: readPage(sp),
  });

  return (
    <PageTransition>
      <PageHeader
        title="Auditoría"
        description="Registro de acciones administrativas: quién hizo qué y cuándo."
      />
      <div className="mb-4">
        <SearchForm
          action={BASE}
          defaultValue={filters.q}
          placeholder="Buscar por detalle, ID o administrador"
          label="Buscar en la auditoría"
        >
          <label className="sm:w-52">
            <span className="sr-only">Filtrar por entidad</span>
            <select
              name="entidad"
              defaultValue={filters.entidad}
              className="border-border bg-surface h-10 w-full rounded-xl border px-3 text-sm"
            >
              <option value="">Todas las entidades</option>
              {AUDIT_ENTITIES.map((entity) => (
                <option key={entity} value={entity}>
                  {AUDIT_ENTITY_LABEL[entity] ?? entity}
                </option>
              ))}
            </select>
          </label>
          <label className="sm:w-52">
            <span className="sr-only">Filtrar por acción</span>
            <select
              name="accion"
              defaultValue={filters.accion}
              className="border-border bg-surface h-10 w-full rounded-xl border px-3 text-sm"
            >
              <option value="">Todas las acciones</option>
              {AUDIT_ACTIONS.map((action) => (
                <option key={action} value={action}>
                  {AUDIT_ACTION_LABEL[action] ?? action}
                </option>
              ))}
            </select>
          </label>
        </SearchForm>
      </div>
      <AdminTable caption="Registro de acciones administrativas" head={HEAD}>
        <tbody>
          {result.items.length === 0 ? (
            <EmptyRow colSpan={HEAD.length} message="No hay acciones registradas con esos filtros." />
          ) : (
            result.items.map((row) => (
              <tr key={row.id}>
                <td className="whitespace-nowrap text-muted">{formatDateTime(row.createdAt)}</td>
                <td>{AUDIT_ACTION_LABEL[row.action] ?? row.action}</td>
                <td className="whitespace-nowrap">
                  {AUDIT_ENTITY_LABEL[row.entity] ?? row.entity}
                  {row.entityId && (
                    <span className="block text-xs text-muted">{row.entityId}</span>
                  )}
                </td>
                <td className="whitespace-nowrap">
                  {row.user
                    ? `${row.user.firstName} ${row.user.lastName}`.trim() || row.user.email
                    : "—"}
                </td>
                <td className="max-w-[320px] truncate" title={row.detail ?? undefined}>
                  {row.detail ?? "—"}
                </td>
                <td className="whitespace-nowrap text-right text-muted">{row.ip ?? "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </AdminTable>
      <div className="mt-6">
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          hrefFor={(p) => hrefWith(BASE, filters, { pagina: p })}
        />
      </div>
    </PageTransition>
  );
}
