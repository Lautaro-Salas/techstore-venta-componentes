import "server-only";
import { LocalStorageProvider } from "./local-storage";
import type { StorageProvider } from "./types";

let provider: StorageProvider | undefined;

/** Proveedor de almacenamiento activo. Reemplazar aquí para usar S3/Cloudinary en producción. */
export function getStorage(): StorageProvider {
  provider ??= new LocalStorageProvider();
  return provider;
}

export type { StorageProvider } from "./types";
