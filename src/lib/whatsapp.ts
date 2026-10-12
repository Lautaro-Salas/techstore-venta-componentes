/** Arma un link wa.me con mensaje prellenado. Devuelve null si no hay número configurado. */
export function whatsappLink(number: string | undefined | null, message: string): string | null {
  const digits = (number ?? "").replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export const WHATSAPP_DEFAULT_MESSAGE = "Hola, estoy consultando por ";
