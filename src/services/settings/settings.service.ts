import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { storeSettingsSchema, type StoreSettings } from "@/schemas/settings";

const SETTINGS_KEY = "store";

/** Valores por defecto: provienen de variables de entorno públicas, nunca de datos reales hardcodeados. */
export function defaultSettings(): StoreSettings {
  return storeSettingsSchema.parse({
    name: process.env.NEXT_PUBLIC_STORE_NAME || "TechStore",
    tagline: "Componentes, periféricos y monitores con garantía oficial",
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "",
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
  });
}

/** Configuración de la tienda (DB sobre defaults). Memoizada por request. */
export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  const defaults = defaultSettings();
  try {
    const row = await db.storeSetting.findUnique({ where: { key: SETTINGS_KEY } });
    if (!row) return defaults;
    const merged = storeSettingsSchema.safeParse({ ...defaults, ...(row.value as object) });
    return merged.success ? merged.data : defaults;
  } catch (error) {
    logger.error("No se pudo leer la configuración de la tienda", error);
    return defaults;
  }
});

export async function saveStoreSettings(settings: StoreSettings): Promise<void> {
  await db.storeSetting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: settings },
    update: { value: settings },
  });
}
