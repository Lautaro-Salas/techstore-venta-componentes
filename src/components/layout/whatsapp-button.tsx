"use client";

import type { MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { WHATSAPP_DEFAULT_MESSAGE, whatsappLink } from "@/lib/whatsapp";

const TITLE_SEPARATOR = "|";

/** Botón flotante. Solo se muestra si hay número configurado (env o admin). */
export function WhatsAppButton({ number }: { number: string }) {
  const pathname = usePathname();
  const href = whatsappLink(number, `${WHATSAPP_DEFAULT_MESSAGE}un producto`);
  if (!href || pathname.startsWith("/checkout") || pathname.startsWith("/admin")) return null;

  // En la ficha de producto, el mensaje incluye el nombre del producto.
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!pathname.startsWith("/producto/")) return;
    const product = document.title.split(TITLE_SEPARATOR)[0]?.trim();
    const link = product ? whatsappLink(number, `${WHATSAPP_DEFAULT_MESSAGE}${product}`) : null;
    if (link) {
      e.preventDefault();
      window.open(link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <a
      href={href}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Consultar por WhatsApp"
      className="fixed right-4 bottom-20 z-30 grid size-13 place-items-center rounded-full bg-[#1fa855] text-white shadow-lg transition-transform hover:scale-105 lg:bottom-6"
    >
      <MessageCircle className="size-6" aria-hidden />
    </a>
  );
}
