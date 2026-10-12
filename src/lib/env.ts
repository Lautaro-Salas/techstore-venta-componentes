import "server-only";
import { z } from "zod";

const optional = z
  .string()
  .optional()
  .transform((value) => (value && value.trim().length > 0 ? value.trim() : undefined));

const MIN_SECRET_LENGTH = 32;

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
  AUTH_SECRET: z.string().min(MIN_SECRET_LENGTH, "AUTH_SECRET debe tener al menos 32 caracteres"),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  SMTP_HOST: optional,
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: optional,
  SMTP_PASSWORD: optional,
  SMTP_FROM: optional,
  WHATSAPP_API_TOKEN: optional,
  WHATSAPP_PHONE_NUMBER_ID: optional,
  MP_ACCESS_TOKEN: optional,
  MP_WEBHOOK_SECRET: optional,
  ANDREANI_API_KEY: optional,
  OCA_API_KEY: optional,
  CORREO_ARGENTINO_API_KEY: optional,
  REDIS_URL: optional,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

/** Lee y valida las variables de entorno del servidor una sola vez. */
export function getEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Variables de entorno inválidas: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export const isProduction = () => process.env.NODE_ENV === "production";
