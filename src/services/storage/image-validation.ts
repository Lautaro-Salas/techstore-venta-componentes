import { AppError } from "@/lib/errors";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, type AllowedImageType } from "@/schemas/admin";

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const RIFF = "RIFF";
const WEBP = "WEBP";
const WEBP_TAG_OFFSET = 8;
const BYTES_PER_MB = 1024 * 1024;

function startsWith(buffer: Uint8Array, signature: number[], offset = 0): boolean {
  return signature.every((byte, i) => buffer[offset + i] === byte);
}

function ascii(text: string): number[] {
  return [...text].map((c) => c.charCodeAt(0));
}

/** Detecta el formato real por los "magic bytes", sin confiar en la extensión ni en el MIME declarado. */
export function detectImageType(buffer: Uint8Array): AllowedImageType | null {
  if (startsWith(buffer, JPEG_SIGNATURE)) return "image/jpeg";
  if (startsWith(buffer, PNG_SIGNATURE)) return "image/png";
  if (startsWith(buffer, ascii(RIFF)) && startsWith(buffer, ascii(WEBP), WEBP_TAG_OFFSET)) return "image/webp";
  return null;
}

function isAllowedType(type: string): type is AllowedImageType {
  return type in ALLOWED_IMAGE_TYPES;
}

/** Valida tipo, tamaño y contenido de una imagen subida. Devuelve la extensión a usar. */
export function validateImageUpload(file: { type: string; size: number }, buffer: Uint8Array): string {
  if (!isAllowedType(file.type)) {
    throw new AppError("VALIDATION", "Formato no permitido. Subí una imagen JPG, PNG o WebP.");
  }
  if (file.size === 0 || buffer.byteLength === 0) throw new AppError("VALIDATION", "El archivo está vacío.");
  if (file.size > MAX_IMAGE_BYTES || buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new AppError("VALIDATION", `La imagen supera el máximo de ${MAX_IMAGE_BYTES / BYTES_PER_MB} MB.`);
  }
  const detected = detectImageType(buffer);
  if (!detected || detected !== file.type) {
    throw new AppError("VALIDATION", "El contenido del archivo no corresponde a una imagen válida.");
  }
  return ALLOWED_IMAGE_TYPES[detected];
}
