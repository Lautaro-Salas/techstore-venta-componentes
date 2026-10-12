import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { getEnv, isProduction } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { RenderedMessage } from "./templates";

export type ChannelResult = "SENT" | "SKIPPED";

/** Canal de salida. Para sumar SMS, push, etc. implementar esta interfaz. */
export interface NotificationChannel {
  name: "email" | "whatsapp";
  isAvailable(): boolean;
  send(recipient: string, message: RenderedMessage): Promise<ChannelResult>;
}

let transporter: Transporter | undefined;

function getTransporter(): Transporter | undefined {
  const env = getEnv();
  if (!env.SMTP_HOST) return undefined;
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  });
  return transporter;
}

export const emailChannel: NotificationChannel = {
  name: "email",
  isAvailable: () => true,
  async send(recipient, message) {
    const smtp = getTransporter();
    if (!smtp) {
      // Sin SMTP: en desarrollo se deja constancia en el log para poder probar los links.
      if (!isProduction()) logger.info("Email (SMTP no configurado)", { to: recipient, subject: message.subject, text: message.text });
      return "SKIPPED";
    }
    await smtp.sendMail({ from: getEnv().SMTP_FROM, to: recipient, subject: message.subject, text: message.text });
    return "SENT";
  },
};

const WHATSAPP_API = "https://graph.facebook.com/v21.0";

/** WhatsApp Business Cloud API. Requiere WHATSAPP_API_TOKEN y WHATSAPP_PHONE_NUMBER_ID. */
export const whatsappChannel: NotificationChannel = {
  name: "whatsapp",
  isAvailable: () => Boolean(getEnv().WHATSAPP_API_TOKEN && getEnv().WHATSAPP_PHONE_NUMBER_ID),
  async send(recipient, message) {
    const env = getEnv();
    if (!env.WHATSAPP_API_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) return "SKIPPED";
    const response = await fetch(`${WHATSAPP_API}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.WHATSAPP_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: recipient, type: "text", text: { body: message.text } }),
    });
    if (!response.ok) throw new Error(`WhatsApp API respondió ${response.status}`);
    return "SENT";
  },
};
