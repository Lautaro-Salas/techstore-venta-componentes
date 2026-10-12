import Link from "next/link";
import { AdminTable, EmptyRow } from "@/components/admin/admin-table";
import { ROLE_LABEL } from "@/components/admin/labels";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { CustomerRow } from "@/services/admin/customers.service";
import { UserRowActions } from "./user-row-actions";

const HEAD = [
  { label: "Cliente" },
  { label: "Rol" },
  { label: "Pedidos", className: "text-right" },
  { label: "Último pedido" },
  { label: "Registrado" },
  { label: "Estado" },
  { label: "Acciones", srOnly: true },
];

interface Props {
  customers: CustomerRow[];
  canManage: boolean;
}

export function CustomersTable({ customers, canManage }: Props) {
  return (
    <AdminTable caption="Listado de clientes" head={HEAD}>
      <tbody>
        {customers.length === 0 ? (
          <EmptyRow colSpan={HEAD.length} message="No hay usuarios con esos filtros." />
        ) : (
          customers.map((c) => (
            <tr key={c.id}>
              <td>
                <Link
                  href={`/admin/clientes/${c.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {c.firstName} {c.lastName}
                </Link>
                <span className="block max-w-[260px] truncate text-xs text-muted" title={c.email}>
                  {c.email}
                </span>
              </td>
              <td>
                <Badge tone={c.role === "CUSTOMER" ? "neutral" : "primary"}>
                  {ROLE_LABEL[c.role] ?? c.role}
                </Badge>
              </td>
              <td className="text-right tabular-nums">{c.ordersCount}</td>
              <td className="whitespace-nowrap text-muted">
                {c.lastOrderAt ? formatDate(c.lastOrderAt) : "—"}
              </td>
              <td className="whitespace-nowrap text-muted">{formatDate(c.createdAt)}</td>
              <td>
                <Badge tone={c.isActive ? "success" : "danger"}>
                  {c.isActive ? "Activa" : "Inactiva"}
                </Badge>
                {!c.emailVerified && (
                  <span className="ml-1 text-xs text-muted">· email sin verificar</span>
                )}
              </td>
              <td className="text-right">
                <UserRowActions user={c} canManage={canManage} />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </AdminTable>
  );
}
