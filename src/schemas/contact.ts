import { z } from "zod";

export const CONTACT_REASONS = {
  GENERAL: "Consulta general",
  ORDER: "Pedido",
  WARRANTY: "Garantía",
  PRODUCT: "Producto",
  RETURN: "Devolución",
  TECHNICAL: "Problema técnico",
  OTHER: "Otro",
} as const;

export type ContactReasonKey = keyof typeof CONTACT_REASONS;

/** Tiempo mínimo razonable para completar el formulario (anti-bots). */
export const MIN_FORM_FILL_MS = 3000;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Ingresá tu nombre").max(100),
  email: z.string().trim().toLowerCase().pipe(z.email("Ingresá un email válido")),
  phone: z.string().trim().max(30).optional().default(""),
  reason: z.enum(Object.keys(CONTACT_REASONS) as [ContactReasonKey, ...ContactReasonKey[]], {
    error: "Elegí un motivo",
  }),
  message: z.string().trim().min(10, "Contanos un poco más (mínimo 10 caracteres)").max(2000),
  // Honeypot: debe quedar vacío
  website: z.string().max(0, "Solicitud inválida").optional().default(""),
  startedAt: z.coerce.number().int().positive(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Elegí una calificación").max(5),
  title: z.string().trim().max(80).optional().default(""),
  comment: z.string().trim().min(10, "Escribí al menos 10 caracteres").max(1500),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Ingresá un email válido")),
});
