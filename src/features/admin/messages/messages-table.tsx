import { AdminTable, EmptyRow } from "@/components/admin/admin-table";
import { CONTACT_REASON_LABEL, CONTACT_STATUS_LABEL } from "@/components/admin/labels";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import type { MessageRow } from "@/services/admin/messages.service";
import { MessageStatusSelect } from "./message-status-select";

const HEAD = [
  { label: "Contacto" },
  { label: "Motivo" },
  { label: "Mensaje" },
  { label: "Fecha" },
  { label: "Estado" },
];

const STATUS_TONE: Record<string, "success" | "warning" | "neutral"> = {
  NEW: "warning",
  READ: "neutral",
  ANSWERED: "success",
};

interface Props {
  messages: MessageRow[];
}

export function MessagesTable({ messages }: Props) {
  return (
    <AdminTable caption="Mensajes de contacto" head={HEAD} minWidth="min-w-[820px]">
      <tbody>
        {messages.length === 0 ? (
          <EmptyRow
            colSpan={HEAD.length}
            message="No hay mensajes con esos filtros."
          />
        ) : (
          messages.map((m) => (
            <tr key={m.id}>
              <td>
                <p className="font-medium">{m.name}</p>
                <a
                  href={`mailto:${m.email}`}
                  className="block max-w-[240px] truncate text-xs text-primary hover:underline"
                >
                  {m.email}
                </a>
                {m.phone && (
                  <p className="text-xs text-muted">{m.phone}</p>
                )}
              </td>
              <td className="whitespace-nowrap">
                {CONTACT_REASON_LABEL[m.reason] ?? m.reason}
              </td>
              <td className="max-w-[360px]">
                <span className="line-clamp-2 text-sm text-muted" title={m.message}>
                  {m.message}
                </span>
              </td>
              <td className="whitespace-nowrap text-muted">
                {formatDateTime(m.createdAt)}
              </td>
              <td>
                <div className="flex flex-col items-start gap-1.5">
                  <Badge tone={STATUS_TONE[m.status] ?? "neutral"}>
                    {CONTACT_STATUS_LABEL[m.status] ?? m.status}
                  </Badge>
                  <MessageStatusSelect messageId={m.id} status={m.status} />
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </AdminTable>
  );
}
