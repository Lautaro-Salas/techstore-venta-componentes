import "server-only";
import type {
  ContactReason,
  ContactStatus,
  Prisma,
} from "@prisma/client";
import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { ADMIN_PAGE_SIZE, totalPages, withSearchAnd, type Paginated } from "@/lib/admin/query";
import { recordAudit } from "./audit.service";

export interface MessageRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  reason: ContactReason;
  status: ContactStatus;
  message: string;
  createdAt: Date;
}

/** Mensajes de contacto: búsqueda por nombre/email/mensaje; filtros por estado y motivo. */
export async function listContactMessages(params: {
  q: string;
  status?: string;
  reason?: string;
  page: number;
}): Promise<Paginated<MessageRow>> {
  const and: Prisma.ContactMessageWhereInput[] = [];
  withSearchAnd<Prisma.ContactMessageWhereInput>(and, params.q, [
    "name",
    "email",
    "message",
  ]);
  if (params.status)
    and.push({ status: params.status as ContactStatus });
  if (params.reason)
    and.push({ reason: params.reason as ContactReason });
  const where: Prisma.ContactMessageWhereInput = { AND: and };
  const [items, total] = await Promise.all([
    db.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    db.contactMessage.count({ where }),
  ]);
  return { items, total, page: params.page, totalPages: totalPages(total) };
}

/** Cantidad de mensajes sin leer y total (para el resumen). */
export async function getMessageCounts(): Promise<{
  unread: number;
  total: number;
}> {
  const [unread, total] = await Promise.all([
    db.contactMessage.count({ where: { status: "NEW" } }),
    db.contactMessage.count(),
  ]);
  return { unread, total };
}

/** Cambia el estado de un mensaje (nuevo → leído → respondido). */
export async function setContactMessageStatus(
  id: string,
  status: string,
  userId: string,
): Promise<string> {
  const message = await db.contactMessage.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, status: true },
  });
  if (!message) throw notFound("Mensaje");
  await db.contactMessage.update({
    where: { id },
    data: { status: status as ContactStatus },
  });
  await recordAudit({
    action: "MESSAGE_STATUS",
    entity: "message",
    entityId: id,
    userId,
    detail: `${message.name} (${message.email}): ${message.status} → ${status}`,
  });
  return status;
}
