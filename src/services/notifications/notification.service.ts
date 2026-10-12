import "server-only";
import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getStoreSettings } from "@/services/settings/settings.service";
import { emailChannel, whatsappChannel, type NotificationChannel } from "./channels";
import { TEMPLATES, type NotificationData, type NotificationEvent } from "./templates";

export interface NotifyInput {
  event: NotificationEvent;
  email?: string;
  phone?: string;
  userId?: string;
  data?: Omit<NotificationData, "storeName" | "siteUrl">;
}

/**
 * Envía una notificación por todos los canales con destinatario.
 * Nunca lanza: un fallo de envío no debe romper una compra o un registro.
 */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    const settings = await getStoreSettings();
    const data: NotificationData = { storeName: settings.name, siteUrl: getEnv().NEXT_PUBLIC_SITE_URL, ...input.data };
    const message = TEMPLATES[input.event](data);
    const targets: [NotificationChannel, string | undefined][] = [
      [emailChannel, input.email],
      [whatsappChannel, input.phone],
    ];
    for (const [channel, recipient] of targets) {
      if (!recipient || !channel.isAvailable()) continue;
      const record = await db.notification.create({
        data: {
          event: input.event,
          channel: channel.name,
          recipient,
          subject: message.subject,
          payload: { ...data },
          userId: input.userId,
        },
      });
      try {
        const status = await channel.send(recipient, message);
        await db.notification.update({ where: { id: record.id }, data: { status, sentAt: status === "SENT" ? new Date() : null } });
      } catch (error) {
        logger.error("Fallo el envío de notificación", error, { event: input.event, channel: channel.name });
        await db.notification.update({ where: { id: record.id }, data: { status: "FAILED", error: String(error).slice(0, 500) } });
      }
    }
  } catch (error) {
    logger.error("No se pudo procesar la notificación", error, { event: input.event });
  }
}
