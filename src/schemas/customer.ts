import { z } from "zod";
import { PROVINCES, isValidCuit, isValidDni, isValidPostalCode, onlyDigits } from "@/lib/argentina";

export const phoneSchema = z
  .string()
  .trim()
  .transform(onlyDigits)
  .pipe(z.string().min(8, "Ingresá un teléfono válido con código de área").max(15, "Teléfono demasiado largo"));

export const documentSchema = z
  .object({
    documentType: z.enum(["DNI", "CUIT", "CUIL"], { error: "Elegí un tipo de documento" }),
    documentNumber: z.string().trim().transform(onlyDigits),
  })
  .superRefine((d, ctx) => {
    const valid = d.documentType === "DNI" ? isValidDni(d.documentNumber) : isValidCuit(d.documentNumber);
    if (!valid) {
      ctx.addIssue({
        code: "custom",
        path: ["documentNumber"],
        message: d.documentType === "DNI" ? "El DNI debe tener 7 u 8 dígitos" : "CUIT/CUIL inválido",
      });
    }
  });

export const profileSchema = z
  .object({
    firstName: z.string().trim().min(2, "Mínimo 2 caracteres").max(60),
    lastName: z.string().trim().min(2, "Mínimo 2 caracteres").max(60),
    phone: z.union([z.literal(""), phoneSchema]),
    documentType: z.union([z.literal(""), z.enum(["DNI", "CUIT", "CUIL"])]),
    documentNumber: z.string().trim().transform(onlyDigits),
    marketingOptIn: z.boolean().default(false),
  })
  .superRefine((d, ctx) => {
    if (!d.documentType) return;
    const valid = d.documentType === "DNI" ? isValidDni(d.documentNumber) : isValidCuit(d.documentNumber);
    if (!valid) ctx.addIssue({ code: "custom", path: ["documentNumber"], message: "Documento inválido" });
  });

export const addressSchema = z.object({
  label: z.string().trim().max(40).optional().default(""),
  recipientName: z.string().trim().min(3, "Ingresá nombre y apellido").max(120),
  phone: phoneSchema,
  street: z.string().trim().min(2, "Ingresá la calle").max(120),
  number: z.string().trim().min(1, "Ingresá la altura").max(10),
  floor: z.string().trim().max(10).optional().default(""),
  apartment: z.string().trim().max(10).optional().default(""),
  city: z.string().trim().min(2, "Ingresá la localidad").max(80),
  province: z.enum(PROVINCES, { error: "Elegí una provincia" }),
  postalCode: z
    .string()
    .trim()
    .toUpperCase()
    .refine(isValidPostalCode, "Código postal inválido (ej: 1425 o C1425ABC)"),
  notes: z.string().trim().max(200).optional().default(""),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
