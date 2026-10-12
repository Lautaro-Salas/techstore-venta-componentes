/** Tipos de componente reconocidos por el motor de compatibilidad y recomendaciones. */
export type ComponentKind =
  | "cpu"
  | "motherboard"
  | "ram"
  | "gpu"
  | "storage"
  | "psu"
  | "case"
  | "cooler"
  | "monitor"
  | "keyboard"
  | "mouse"
  | "headset"
  | "cable"
  | "mount";

/** Relación slug de categoría → tipo de componente. Agregar nuevas categorías acá. */
export const CATEGORY_KIND: Record<string, ComponentKind> = {
  procesadores: "cpu",
  motherboards: "motherboard",
  "memorias-ram": "ram",
  "placas-de-video": "gpu",
  almacenamiento: "storage",
  fuentes: "psu",
  gabinetes: "case",
  coolers: "cooler",
  monitores: "monitor",
  teclados: "keyboard",
  mouse: "mouse",
  auriculares: "headset",
  cables: "cable",
  soportes: "mount",
};

export function kindForCategory(slug: string): ComponentKind | undefined {
  return CATEGORY_KIND[slug];
}

export function categoriesForKind(kind: ComponentKind): string[] {
  return Object.entries(CATEGORY_KIND)
    .filter(([, k]) => k === kind)
    .map(([slug]) => slug);
}

/** Qué conviene sugerir para "Completá tu setup" según lo que se está viendo. */
export const SETUP_COMPLEMENTS: Record<ComponentKind, ComponentKind[]> = {
  cpu: ["motherboard", "cooler", "ram"],
  motherboard: ["cpu", "ram", "storage"],
  ram: ["motherboard", "cpu"],
  gpu: ["psu", "case", "monitor", "cable"],
  storage: ["motherboard"],
  psu: ["gpu", "case"],
  case: ["psu", "cooler", "motherboard"],
  cooler: ["cpu", "case"],
  monitor: ["cable", "mount", "gpu"],
  keyboard: ["mouse", "headset"],
  mouse: ["keyboard", "headset"],
  headset: ["keyboard", "mouse"],
  cable: ["monitor"],
  mount: ["monitor"],
};

/** Claves técnicas de especificaciones usadas por las reglas. */
export const SPEC = {
  socket: "socket",
  sockets: "sockets",
  memoryType: "memory_type",
  formFactor: "form_factor",
  supportedFormFactors: "supported_form_factors",
  wattage: "wattage",
  recommendedPsu: "recommended_psu_w",
  lengthMm: "length_mm",
  maxGpuLengthMm: "max_gpu_length_mm",
  heightMm: "height_mm",
  maxCoolerHeightMm: "max_cooler_height_mm",
  tdp: "tdp_w",
  maxTdp: "max_tdp_w",
} as const;
