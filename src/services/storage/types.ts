/** Adaptador de almacenamiento de archivos (local, S3, Cloudinary, etc.). */
export interface StorageProvider {
  /** Guarda el archivo y devuelve la URL pública. */
  save(buffer: Buffer, ext: string): Promise<string>;
  /** Elimina un archivo previamente guardado por este proveedor. Ignora URLs ajenas. */
  delete(url: string): Promise<void>;
  /** Indica si la URL pertenece a este proveedor. */
  owns(url: string): boolean;
}
