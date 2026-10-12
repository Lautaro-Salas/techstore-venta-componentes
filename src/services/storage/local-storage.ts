import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { logger } from "@/lib/logger";
import type { StorageProvider } from "./types";

const PUBLIC_PREFIX = "/uploads/";
/** Solo nombres generados por este proveedor: evita borrar archivos fuera de la carpeta. */
const FILE_NAME_PATTERN = /^[a-f0-9-]{36}\.(jpg|png|webp)$/;

/** Guarda archivos en public/uploads (adecuado para desarrollo o un único servidor con disco persistente). */
export class LocalStorageProvider implements StorageProvider {
  private readonly directory = path.join(process.cwd(), "public", "uploads");

  async save(buffer: Buffer, ext: string): Promise<string> {
    const fileName = `${randomUUID()}.${ext}`;
    if (!FILE_NAME_PATTERN.test(fileName)) throw new Error("Extensión de archivo no permitida");
    await mkdir(this.directory, { recursive: true });
    await writeFile(path.join(this.directory, fileName), buffer);
    return `${PUBLIC_PREFIX}${fileName}`;
  }

  owns(url: string): boolean {
    return url.startsWith(PUBLIC_PREFIX) && FILE_NAME_PATTERN.test(url.slice(PUBLIC_PREFIX.length));
  }

  async delete(url: string): Promise<void> {
    if (!this.owns(url)) return;
    try {
      await unlink(path.join(this.directory, url.slice(PUBLIC_PREFIX.length)));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") logger.error("No se pudo borrar el archivo subido", error, { url });
    }
  }
}
