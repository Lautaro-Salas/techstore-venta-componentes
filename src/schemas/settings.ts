import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).default("");
const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), "Ingresá una URL válida (https://...)")
  .default("");

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Usá un color hexadecimal, por ejemplo #2563EB");

export const storeSettingsSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio").max(60),
  tagline: optionalText(120),
  logoUrl: optionalText(300),
  primaryColor: hexColor.default("#2563EB"),
  email: z.union([z.literal(""), z.email("Email inválido")]).default(""),
  phone: optionalText(40),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\d{0,15}$/, "Solo números con código de país, sin + ni espacios (ej: 5491112345678)")
    .default(""),
  address: optionalText(200),
  businessHours: optionalText(200),
  social: z
    .object({
      instagram: optionalUrl,
      facebook: optionalUrl,
      tiktok: optionalUrl,
      youtube: optionalUrl,
    })
    .default({ instagram: "", facebook: "", tiktok: "", youtube: "" }),
  bank: z
    .object({
      bankName: optionalText(80),
      holder: optionalText(120),
      cuit: optionalText(20),
      cbu: z.string().trim().regex(/^(\d{22})?$/, "El CBU/CVU debe tener 22 dígitos").default(""),
      alias: optionalText(40),
    })
    .default({ bankName: "", holder: "", cuit: "", cbu: "", alias: "" }),
  vatRatePercent: z.coerce.number().min(0).max(100).default(21),
  showPriceWithoutTaxes: z.boolean().default(true),
  invoiceAEnabled: z.boolean().default(true),
});

export type StoreSettings = z.infer<typeof storeSettingsSchema>;

const urlField = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), "Ingresá una URL válida (https://...)");

const textField = (max: number) => z.string().trim().max(max);

const formVatRate = z
  .string()
  .trim()
  .min(1, "Este campo es obligatorio")
  .transform((v) => Number(v.replace(",", ".")))
  .pipe(
    z
      .number({ error: "Ingresá un porcentaje válido" })
      .min(0, "No puede ser negativo")
      .max(100, "No puede superar 100"),
  );

/**
 * Configuración de tienda para formularios: todos los campos son
 * requeridos (el formulario siempre los envía completos). El resultado
 * parseado es compatible con StoreSettings.
 */
export const storeSettingsFormSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio").max(60),
  tagline: textField(120),
  logoUrl: textField(300),
  primaryColor: hexColor,
  email: z.union([z.literal(""), z.email("Email inválido")]),
  phone: textField(40),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\d{0,15}$/, "Solo números con código de país, sin + ni espacios (ej: 5491112345678)"),
  address: textField(200),
  businessHours: textField(200),
  social: z.object({
    instagram: urlField,
    facebook: urlField,
    tiktok: urlField,
    youtube: urlField,
  }),
  bank: z.object({
    bankName: textField(80),
    holder: textField(120),
    cuit: textField(20),
    cbu: z.string().trim().regex(/^(\d{22})?$/, "El CBU/CVU debe tener 22 dígitos"),
    alias: textField(40),
  }),
  vatRatePercent: formVatRate,
  showPriceWithoutTaxes: z.boolean(),
  invoiceAEnabled: z.boolean(),
});

export type StoreSettingsFormValues = z.input<typeof storeSettingsFormSchema>;
