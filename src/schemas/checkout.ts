import { z } from "zod";
import { addressSchema, documentSchema, phoneSchema } from "./customer";

export const contactStepSchema = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email("Ingresá un email válido")),
    firstName: z.string().trim().min(2, "Ingresá tu nombre").max(60),
    lastName: z.string().trim().min(2, "Ingresá tu apellido").max(60),
    phone: phoneSchema,
    invoiceType: z.enum(["CONSUMIDOR_FINAL", "FACTURA_A"]).default("CONSUMIDOR_FINAL"),
    businessName: z.string().trim().max(120).optional().default(""),
  })
  .and(documentSchema)
  .superRefine((d, ctx) => {
    if (d.invoiceType === "FACTURA_A") {
      if (d.documentType !== "CUIT") {
        ctx.addIssue({ code: "custom", path: ["documentType"], message: "Para Factura A ingresá un CUIT" });
      }
      if (!d.businessName) {
        ctx.addIssue({ code: "custom", path: ["businessName"], message: "Ingresá la razón social" });
      }
    }
  });

export const checkoutSchema = z.object({
  contact: contactStepSchema,
  shippingMethodCode: z.string().min(1, "Elegí un método de envío"),
  address: addressSchema.nullable(),
  saveAddress: z.boolean().default(false),
  paymentMethodCode: z.string().min(1, "Elegí un método de pago"),
  installments: z.coerce.number().int().min(1).max(24).default(1),
  notes: z.string().trim().max(500).optional().default(""),
});

export type ContactStepInput = z.infer<typeof contactStepSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
