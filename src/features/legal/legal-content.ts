export const LEGAL_SLUGS = ["terminos", "privacidad", "cambios", "devoluciones", "garantia", "envios"] as const;

export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  items?: string[];
}

export interface LegalPage {
  slug: LegalSlug;
  title: string;
  description: string;
  sections: LegalSection[];
}

export interface LegalNavItem {
  slug: LegalSlug;
  title: string;
}

/** Títulos para la navegación lateral (no dependen de la configuración). */
export const LEGAL_NAV: LegalNavItem[] = [
  { slug: "terminos", title: "Términos y condiciones" },
  { slug: "privacidad", title: "Política de privacidad" },
  { slug: "cambios", title: "Política de cambios" },
  { slug: "devoluciones", title: "Política de devoluciones" },
  { slug: "garantia", title: "Política de garantía" },
  { slug: "envios", title: "Información de envíos" },
];

export function isLegalSlug(value: string): value is LegalSlug {
  return (LEGAL_SLUGS as readonly string[]).includes(value);
}

type Builder = (store: string) => Omit<LegalPage, "slug" | "title">;

/*
 * Plantillas de referencia: cada sección describe QUÉ debe contener el texto final.
 * No constituyen asesoramiento legal; deben reemplazarse por el texto revisado por un profesional.
 */
const BUILDERS: Record<LegalSlug, Builder> = {
  terminos: (store) => ({
    description: `Condiciones generales de uso del sitio y de compra en ${store}.`,
    sections: [
      {
        heading: "1. Identificación del titular",
        paragraphs: [`Identificación del titular del sitio ${store}: razón social, CUIT, domicilio legal y datos de contacto.`],
      },
      {
        heading: "2. Aceptación de las condiciones",
        paragraphs: ["Alcance de estos términos, a quiénes se aplican y desde cuándo rigen. Forma en que se comunican sus modificaciones."],
      },
      {
        heading: "3. Registro y cuenta de usuario",
        items: [
          "Requisitos para registrarse y datos solicitados.",
          "Responsabilidad del usuario sobre la confidencialidad de su contraseña.",
          "Supuestos de suspensión o baja de la cuenta.",
        ],
      },
      {
        heading: "4. Productos, precios y stock",
        items: [
          "Moneda de los precios e inclusión de impuestos.",
          "Vigencia de precios y promociones publicadas.",
          "Tratamiento de errores de publicación y disponibilidad de stock.",
        ],
      },
      {
        heading: "5. Proceso de compra y medios de pago",
        paragraphs: ["Pasos para concretar una compra, momento en que se considera confirmada, medios de pago aceptados y condiciones de cuotas o descuentos."],
      },
      {
        heading: "6. Facturación",
        paragraphs: ["Tipo de comprobante que se emite según la condición fiscal del comprador y datos requeridos para su emisión."],
      },
      {
        heading: "7. Envíos, cambios, devoluciones y garantía",
        paragraphs: ["Remisión a las políticas específicas de envíos, cambios, devoluciones y garantía publicadas en el sitio."],
      },
      {
        heading: "8. Derecho de revocación",
        paragraphs: ["Descripción del derecho de revocación aplicable a compras a distancia, plazo, forma de ejercerlo y acceso al botón de arrepentimiento."],
      },
      {
        heading: "9. Propiedad intelectual",
        paragraphs: ["Titularidad de los contenidos, marcas e imágenes del sitio y usos permitidos."],
      },
      {
        heading: "10. Responsabilidad",
        paragraphs: ["Alcance y límites de la responsabilidad del titular del sitio respecto del uso de la plataforma."],
      },
      {
        heading: "11. Ley aplicable y jurisdicción",
        paragraphs: ["Normativa aplicable y jurisdicción competente para la resolución de conflictos."],
      },
    ],
  }),
  privacidad: (store) => ({
    description: `Cómo ${store} recolecta, usa y protege los datos personales.`,
    sections: [
      {
        heading: "1. Responsable del tratamiento",
        paragraphs: [`Identificación del responsable de la base de datos de ${store}: razón social, CUIT, domicilio y canal de contacto para consultas sobre privacidad.`],
      },
      {
        heading: "2. Datos que se recolectan",
        items: [
          "Datos que el usuario proporciona (por ejemplo, nombre, email, teléfono, domicilio, datos fiscales).",
          "Datos que se obtienen automáticamente al navegar (por ejemplo, dirección IP, dispositivo, cookies).",
          "Datos de pagos y aclaración sobre qué información procesan terceros.",
        ],
      },
      {
        heading: "3. Finalidades del tratamiento",
        paragraphs: ["Usos previstos de los datos: gestión de pedidos, facturación, atención al cliente, comunicaciones comerciales y mejoras del sitio."],
      },
      {
        heading: "4. Cesión a terceros",
        paragraphs: ["Terceros con los que se comparten datos (por ejemplo, empresas de logística, procesadores de pago, proveedores de servicios) y finalidad de cada cesión."],
      },
      {
        heading: "5. Cookies y tecnologías similares",
        paragraphs: ["Tipos de cookies utilizadas, su finalidad y cómo el usuario puede configurarlas o deshabilitarlas."],
      },
      {
        heading: "6. Derechos de los titulares",
        paragraphs: ["Derechos de acceso, rectificación, actualización y supresión, forma de ejercerlos y autoridad de control ante la cual se pueden presentar reclamos."],
      },
      {
        heading: "7. Seguridad y conservación",
        paragraphs: ["Medidas de seguridad aplicadas y plazo de conservación de los datos."],
      },
      {
        heading: "8. Comunicaciones comerciales",
        paragraphs: ["Cómo darse de baja de newsletters y otras comunicaciones."],
      },
      {
        heading: "9. Modificaciones",
        paragraphs: ["Forma de comunicar cambios en esta política y fecha de última actualización."],
      },
    ],
  }),
  cambios: (store) => ({
    description: `Condiciones para solicitar el cambio de un producto comprado en ${store}.`,
    sections: [
      {
        heading: "1. Alcance",
        paragraphs: ["Casos en los que se aceptan cambios (por ejemplo, otro modelo, variante o producto) y diferencia con la devolución y la garantía."],
      },
      {
        heading: "2. Plazo para solicitar el cambio",
        paragraphs: ["Plazo durante el cual se puede pedir un cambio y desde qué momento se cuenta."],
      },
      {
        heading: "3. Condiciones del producto",
        items: [
          "Estado en que debe encontrarse el producto.",
          "Accesorios, manuales y embalaje que deben acompañarlo.",
          "Productos excluidos de cambio, si los hubiera.",
        ],
      },
      {
        heading: "4. Cómo solicitarlo",
        paragraphs: ["Canal para iniciar la solicitud, datos requeridos (número de pedido, producto, motivo) y pasos siguientes."],
      },
      {
        heading: "5. Costos de envío y diferencias de precio",
        paragraphs: ["Quién asume los costos de envío del cambio y cómo se resuelven las diferencias de precio entre productos."],
      },
    ],
  }),
  devoluciones: (store) => ({
    description: `Condiciones para devolver un producto y solicitar el reintegro en ${store}.`,
    sections: [
      {
        heading: "1. Derecho de revocación (arrepentimiento)",
        paragraphs: ["Descripción del derecho de revocación en compras a distancia: plazo, desde cuándo se computa, forma de ejercerlo y acceso al botón de arrepentimiento."],
      },
      {
        heading: "2. Condiciones del producto",
        paragraphs: ["Estado en que debe devolverse el producto, accesorios y embalaje requeridos."],
      },
      {
        heading: "3. Procedimiento",
        items: [
          "Canal para iniciar la devolución y datos requeridos.",
          "Forma de envío o entrega del producto.",
          "Revisión del producto al recibirlo.",
        ],
      },
      {
        heading: "4. Reintegro",
        paragraphs: ["Medio por el cual se reintegra el dinero, plazos estimados según el medio de pago y tratamiento de los costos de envío."],
      },
      {
        heading: "5. Productos con fallas",
        paragraphs: ["Remisión a la política de garantía para productos defectuosos."],
      },
    ],
  }),
  garantia: (store) => ({
    description: `Cobertura de garantía de los productos vendidos por ${store}.`,
    sections: [
      {
        heading: "1. Cobertura",
        paragraphs: ["Tipo de garantía de los productos (oficial del fabricante o del vendedor), qué cubre y dónde se informa el plazo de cada producto."],
      },
      {
        heading: "2. Plazos",
        paragraphs: ["Plazo de garantía aplicable y desde cuándo se computa."],
      },
      {
        heading: "3. Exclusiones",
        items: [
          "Daños por mal uso, golpes, humedad o instalación incorrecta.",
          "Intervención de terceros no autorizados.",
          "Otras exclusiones que se definan.",
        ],
      },
      {
        heading: "4. Cómo hacer un reclamo",
        paragraphs: ["Canal de contacto, documentación requerida (comprobante de compra, número de serie, descripción de la falla) y pasos del proceso."],
      },
      {
        heading: "5. Servicio técnico",
        paragraphs: ["Si la gestión se realiza por la tienda o mediante el servicio técnico oficial de la marca, y plazos estimados de diagnóstico y reparación."],
      },
      {
        heading: "6. Costos de traslado",
        paragraphs: ["Quién asume los costos de envío del producto durante el proceso de garantía."],
      },
    ],
  }),
  envios: (store) => ({
    description: `Opciones, costos y plazos de entrega de los pedidos de ${store}.`,
    sections: [
      {
        heading: "1. Zonas de cobertura",
        paragraphs: ["Zonas del país a las que se realizan envíos y posibles restricciones."],
      },
      {
        heading: "2. Métodos de envío",
        items: [
          "Envío a domicilio estándar.",
          "Envío express, en las zonas donde esté disponible.",
          "Retiro en local, si está habilitado: dirección, horarios y documentación requerida.",
        ],
      },
      {
        heading: "3. Costos",
        paragraphs: ["Cómo se calcula el costo de envío y condiciones de las promociones de envío gratis. El costo final se informa en el checkout antes de pagar."],
      },
      {
        heading: "4. Plazos de entrega",
        paragraphs: ["Plazos estimados por método y zona, y desde cuándo se cuentan (por ejemplo, desde la acreditación del pago)."],
      },
      {
        heading: "5. Seguimiento",
        paragraphs: ["Cómo se informa el número de seguimiento y dónde consultar el estado del pedido."],
      },
      {
        heading: "6. Recepción del pedido",
        paragraphs: ["Recomendaciones para recibir el paquete, qué hacer si llega dañado y plazo para informarlo."],
      },
    ],
  }),
};

export function getLegalPage(slug: LegalSlug, storeName: string): LegalPage {
  const nav = LEGAL_NAV.find((item) => item.slug === slug);
  return { slug, title: nav?.title ?? slug, ...BUILDERS[slug](storeName) };
}
