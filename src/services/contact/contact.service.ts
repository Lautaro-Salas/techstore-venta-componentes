import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { MIN_FORM_FILL_MS, type ContactInput } from "@/schemas/contact";

/** Guarda un mensaje de contacto aplicando controles anti-spam (honeypot + tiempo mínimo). */
export async function submitContactMessage(input: ContactInput, ip: string, now = Date.now()): Promise<void> {
  if (input.website || now - input.startedAt < MIN_FORM_FILL_MS) {
    throw new AppError("VALIDATION", "No pudimos enviar tu mensaje. Intentá nuevamente.");
  }
  await db.contactMessage.create({
    data: { name: input.name, email: input.email, phone: input.phone || null, reason: input.reason, message: input.message, ip },
  });
}

export async function subscribeNewsletter(email: string): Promise<void> {
  await db.newsletterSubscriber.upsert({ where: { email }, create: { email }, update: {} });
}
