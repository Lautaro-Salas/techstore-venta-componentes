/**
 * DATOS DEMO — catálogo ficticio para desarrollo y pruebas.
 * Precios en ARS de referencia, inventados. Reemplazar por el catálogo real
 * (importación desde ERP o carga en /admin/productos) antes de operar.
 */

export interface SeedCategory {
  name: string;
  slug: string;
  icon: string;
  description: string;
  children?: SeedCategory[];
}

export const CATEGORIES: SeedCategory[] = [
  {
    name: "Componentes",
    slug: "componentes",
    icon: "cpu",
    description: "Todo para armar o actualizar tu PC.",
    children: [
      { name: "Procesadores", slug: "procesadores", icon: "cpu", description: "CPUs AMD e Intel." },
      { name: "Motherboards", slug: "motherboards", icon: "circuit-board", description: "Placas madre AM5, AM4 y LGA1700." },
      { name: "Memorias RAM", slug: "memorias-ram", icon: "memory-stick", description: "DDR4 y DDR5 para escritorio." },
      { name: "Placas de video", slug: "placas-de-video", icon: "gpu", description: "GPUs NVIDIA GeForce y AMD Radeon." },
      { name: "Almacenamiento", slug: "almacenamiento", icon: "hard-drive", description: "SSD NVMe, SATA y discos rígidos." },
      { name: "Fuentes", slug: "fuentes", icon: "plug", description: "Fuentes certificadas 80 Plus." },
      { name: "Gabinetes", slug: "gabinetes", icon: "box", description: "Gabinetes ATX, Micro-ATX y Mini-ITX." },
      { name: "Coolers", slug: "coolers", icon: "fan", description: "Refrigeración por aire y líquida." },
    ],
  },
  {
    name: "Periféricos",
    slug: "perifericos",
    icon: "keyboard",
    description: "Teclados, mouse y auriculares para jugar y trabajar.",
    children: [
      { name: "Teclados", slug: "teclados", icon: "keyboard", description: "Mecánicos y de membrana." },
      { name: "Mouse", slug: "mouse", icon: "mouse", description: "Mouse gamer y de oficina." },
      { name: "Auriculares", slug: "auriculares", icon: "headphones", description: "Headsets con y sin cable." },
    ],
  },
  {
    name: "Monitores",
    slug: "monitores",
    icon: "monitor",
    description: "Monitores gamer y para productividad.",
  },
  {
    name: "Accesorios",
    slug: "accesorios",
    icon: "cable",
    description: "Cables, soportes y más.",
    children: [
      { name: "Cables", slug: "cables", icon: "cable", description: "HDMI, DisplayPort y USB." },
      { name: "Soportes", slug: "soportes", icon: "monitor-up", description: "Soportes y brazos para monitor." },
    ],
  },
];

export const BRANDS = [
  "AMD", "Intel", "NVIDIA", "ASUS", "MSI", "Gigabyte", "ASRock", "Corsair", "Kingston", "Logitech",
  "Razer", "HyperX", "Western Digital", "Samsung", "Cooler Master", "Redragon", "LG", "Seagate",
  "Thermaltake", "Lian Li", "Noctua", "be quiet!", "Crucial", "Ugreen",
];

/** Etiqueta visible, grupo y si se ofrece como filtro, por clave técnica. */
export const SPEC_META: Record<string, { label: string; group: string; filterable?: boolean }> = {
  socket: { label: "Socket", group: "Compatibilidad", filterable: true },
  sockets: { label: "Sockets compatibles", group: "Compatibilidad" },
  cores: { label: "Núcleos / hilos", group: "Rendimiento", filterable: true },
  base_clock: { label: "Frecuencia base", group: "Rendimiento" },
  boost_clock: { label: "Frecuencia turbo", group: "Rendimiento" },
  tdp_w: { label: "TDP (W)", group: "Energía" },
  max_tdp_w: { label: "TDP máximo soportado (W)", group: "Rendimiento" },
  integrated_graphics: { label: "Gráficos integrados", group: "Rendimiento", filterable: true },
  chipset: { label: "Chipset", group: "General", filterable: true },
  form_factor: { label: "Formato", group: "General", filterable: true },
  memory_type: { label: "Tipo de memoria", group: "Memoria", filterable: true },
  memory_slots: { label: "Slots de memoria", group: "Memoria" },
  capacity: { label: "Capacidad", group: "General", filterable: true },
  frequency: { label: "Frecuencia", group: "Rendimiento", filterable: true },
  latency: { label: "Latencia", group: "Rendimiento" },
  modules: { label: "Módulos", group: "General" },
  vram: { label: "Memoria de video", group: "Memoria", filterable: true },
  gpu_chip: { label: "Chip gráfico", group: "General", filterable: true },
  length_mm: { label: "Largo (mm)", group: "Dimensiones" },
  recommended_psu_w: { label: "Fuente recomendada (W)", group: "Energía" },
  interface: { label: "Interfaz", group: "General", filterable: true },
  read_speed: { label: "Lectura secuencial", group: "Rendimiento" },
  write_speed: { label: "Escritura secuencial", group: "Rendimiento" },
  wattage: { label: "Potencia (W)", group: "Energía", filterable: true },
  certification: { label: "Certificación", group: "Energía", filterable: true },
  modular: { label: "Modular", group: "General", filterable: true },
  supported_form_factors: { label: "Formatos de motherboard", group: "Compatibilidad" },
  max_gpu_length_mm: { label: "Largo máx. de GPU (mm)", group: "Compatibilidad" },
  max_cooler_height_mm: { label: "Altura máx. de cooler (mm)", group: "Compatibilidad" },
  cooler_type: { label: "Tipo", group: "General", filterable: true },
  height_mm: { label: "Altura (mm)", group: "Dimensiones" },
  size: { label: "Tamaño", group: "Pantalla", filterable: true },
  resolution: { label: "Resolución", group: "Pantalla", filterable: true },
  refresh_rate: { label: "Frecuencia de actualización", group: "Pantalla", filterable: true },
  panel: { label: "Panel", group: "Pantalla", filterable: true },
  response_time: { label: "Tiempo de respuesta", group: "Pantalla" },
  switch: { label: "Switch", group: "General", filterable: true },
  layout: { label: "Layout", group: "General", filterable: true },
  connection: { label: "Conexión", group: "Conectividad", filterable: true },
  dpi: { label: "DPI máximo", group: "Rendimiento" },
  weight: { label: "Peso", group: "General" },
  driver: { label: "Driver", group: "Audio" },
  microphone: { label: "Micrófono", group: "Audio" },
  cable_type: { label: "Tipo", group: "General", filterable: true },
  cable_length: { label: "Largo", group: "General" },
  max_monitor_size: { label: "Tamaño máx. de monitor", group: "Compatibilidad" },
};

export interface SeedProduct {
  name: string;
  brand: string;
  category: string;
  price: number;
  compareAt?: number;
  stock: number;
  minStock?: number;
  warranty?: number;
  featured?: boolean;
  /** días desde el alta (para "recién llegados") */
  ageDays?: number;
  sold?: number;
  weight?: number;
  short: string;
  specs: Record<string, string>;
  tags?: string[];
}

export const PRODUCTS: SeedProduct[] = [
  // ---------- Procesadores ----------
  { name: "AMD Ryzen 7 7800X3D", brand: "AMD", category: "procesadores", price: 689990, compareAt: 799990, stock: 14, sold: 210, featured: true, short: "8 núcleos con 3D V-Cache, ideal para gaming.", specs: { socket: "AM5", cores: "8 / 16", base_clock: "4.2 GHz", boost_clock: "5.0 GHz", tdp_w: "120", integrated_graphics: "Sí" }, tags: ["gaming", "am5"] },
  { name: "AMD Ryzen 5 7600", brand: "AMD", category: "procesadores", price: 329990, stock: 22, sold: 180, short: "6 núcleos Zen 4 con cooler incluido.", specs: { socket: "AM5", cores: "6 / 12", base_clock: "3.8 GHz", boost_clock: "5.1 GHz", tdp_w: "65", integrated_graphics: "Sí" } },
  { name: "AMD Ryzen 5 5600", brand: "AMD", category: "procesadores", price: 159990, compareAt: 189990, stock: 3, minStock: 5, sold: 340, short: "El clásico calidad-precio para AM4.", specs: { socket: "AM4", cores: "6 / 12", base_clock: "3.5 GHz", boost_clock: "4.4 GHz", tdp_w: "65", integrated_graphics: "No" } },
  { name: "AMD Ryzen 9 7950X", brand: "AMD", category: "procesadores", price: 949990, stock: 5, sold: 40, short: "16 núcleos para creación de contenido.", specs: { socket: "AM5", cores: "16 / 32", base_clock: "4.5 GHz", boost_clock: "5.7 GHz", tdp_w: "170", integrated_graphics: "Sí" } },
  { name: "Intel Core i5-14400F", brand: "Intel", category: "procesadores", price: 289990, stock: 18, sold: 150, short: "10 núcleos híbridos para gaming.", specs: { socket: "LGA1700", cores: "10 / 16", base_clock: "2.5 GHz", boost_clock: "4.7 GHz", tdp_w: "65", integrated_graphics: "No" } },
  { name: "Intel Core i7-14700K", brand: "Intel", category: "procesadores", price: 649990, compareAt: 719990, stock: 7, sold: 75, short: "20 núcleos desbloqueado.", specs: { socket: "LGA1700", cores: "20 / 28", base_clock: "3.4 GHz", boost_clock: "5.6 GHz", tdp_w: "125", integrated_graphics: "Sí" } },
  { name: "Intel Core i3-12100F", brand: "Intel", category: "procesadores", price: 119990, stock: 0, sold: 260, short: "4 núcleos para PCs de entrada.", specs: { socket: "LGA1700", cores: "4 / 8", base_clock: "3.3 GHz", boost_clock: "4.3 GHz", tdp_w: "58", integrated_graphics: "No" } },

  // ---------- Motherboards ----------
  { name: "ASUS TUF Gaming B650-Plus WiFi", brand: "ASUS", category: "motherboards", price: 359990, stock: 9, sold: 95, short: "AM5 robusta con WiFi 6.", specs: { socket: "AM5", chipset: "B650", form_factor: "ATX", memory_type: "DDR5", memory_slots: "4" } },
  { name: "MSI MAG B650M Mortar WiFi", brand: "MSI", category: "motherboards", price: 329990, compareAt: 369990, stock: 11, sold: 88, short: "Micro-ATX AM5 con buen VRM.", specs: { socket: "AM5", chipset: "B650", form_factor: "Micro-ATX", memory_type: "DDR5", memory_slots: "4" } },
  { name: "Gigabyte B550M DS3H", brand: "Gigabyte", category: "motherboards", price: 139990, stock: 16, sold: 220, short: "AM4 económica y confiable.", specs: { socket: "AM4", chipset: "B550", form_factor: "Micro-ATX", memory_type: "DDR4", memory_slots: "4" } },
  { name: "ASRock B760M Pro RS", brand: "ASRock", category: "motherboards", price: 199990, stock: 8, sold: 60, short: "LGA1700 con soporte DDR5.", specs: { socket: "LGA1700", chipset: "B760", form_factor: "Micro-ATX", memory_type: "DDR5", memory_slots: "4" } },
  { name: "MSI PRO Z790-A WiFi", brand: "MSI", category: "motherboards", price: 489990, stock: 4, sold: 30, short: "Z790 para overclock en Intel.", specs: { socket: "LGA1700", chipset: "Z790", form_factor: "ATX", memory_type: "DDR5", memory_slots: "4" } },
  { name: "ASUS ROG Strix B650E-I Gaming WiFi", brand: "ASUS", category: "motherboards", price: 539990, stock: 2, minStock: 3, sold: 12, ageDays: 10, short: "Mini-ITX premium para builds compactas.", specs: { socket: "AM5", chipset: "B650E", form_factor: "Mini-ITX", memory_type: "DDR5", memory_slots: "2" } },

  // ---------- Memorias ----------
  { name: "Kingston Fury Beast 32GB (2x16) DDR5 6000", brand: "Kingston", category: "memorias-ram", price: 159990, compareAt: 179990, stock: 25, sold: 190, short: "Kit DDR5 ideal para AM5.", specs: { memory_type: "DDR5", capacity: "32 GB", frequency: "6000 MHz", latency: "CL36", modules: "2 x 16 GB" } },
  { name: "Corsair Vengeance 16GB (2x8) DDR5 5600", brand: "Corsair", category: "memorias-ram", price: 89990, stock: 19, sold: 120, short: "Kit DDR5 de entrada.", specs: { memory_type: "DDR5", capacity: "16 GB", frequency: "5600 MHz", latency: "CL36", modules: "2 x 8 GB" } },
  { name: "Kingston Fury Beast 16GB (2x8) DDR4 3200", brand: "Kingston", category: "memorias-ram", price: 54990, stock: 30, sold: 410, short: "DDR4 confiable para AM4 y LGA1700.", specs: { memory_type: "DDR4", capacity: "16 GB", frequency: "3200 MHz", latency: "CL16", modules: "2 x 8 GB" } },
  { name: "Crucial Pro 32GB (2x16) DDR4 3200", brand: "Crucial", category: "memorias-ram", price: 94990, stock: 12, sold: 70, short: "32 GB DDR4 para multitarea.", specs: { memory_type: "DDR4", capacity: "32 GB", frequency: "3200 MHz", latency: "CL22", modules: "2 x 16 GB" } },
  { name: "Corsair Dominator Titanium 64GB (2x32) DDR5 6400", brand: "Corsair", category: "memorias-ram", price: 429990, stock: 3, sold: 8, ageDays: 15, short: "Alto rendimiento para workstation.", specs: { memory_type: "DDR5", capacity: "64 GB", frequency: "6400 MHz", latency: "CL32", modules: "2 x 32 GB" } },

  // ---------- Placas de video ----------
  { name: "ASUS Dual GeForce RTX 4060 8GB OC", brand: "ASUS", category: "placas-de-video", price: 489990, compareAt: 559990, stock: 13, sold: 260, featured: true, short: "1080p alto con DLSS 3.", specs: { gpu_chip: "GeForce RTX 4060", vram: "8 GB GDDR6", length_mm: "227", recommended_psu_w: "550", boost_clock: "2535 MHz" } },
  { name: "MSI GeForce RTX 4070 Super Ventus 2X 12GB", brand: "MSI", category: "placas-de-video", price: 1149990, stock: 6, sold: 90, featured: true, short: "1440p con ray tracing.", specs: { gpu_chip: "GeForce RTX 4070 Super", vram: "12 GB GDDR6X", length_mm: "242", recommended_psu_w: "650", boost_clock: "2475 MHz" } },
  { name: "ASUS TUF Gaming GeForce RTX 5070 12GB", brand: "ASUS", category: "placas-de-video", price: 1399990, stock: 4, sold: 25, ageDays: 7, featured: true, short: "Nueva generación con DLSS 4.", specs: { gpu_chip: "GeForce RTX 5070", vram: "12 GB GDDR7", length_mm: "330", recommended_psu_w: "750", boost_clock: "2610 MHz" } },
  { name: "Gigabyte Radeon RX 7600 Gaming OC 8GB", brand: "Gigabyte", category: "placas-de-video", price: 419990, stock: 10, sold: 110, short: "Excelente para 1080p.", specs: { gpu_chip: "Radeon RX 7600", vram: "8 GB GDDR6", length_mm: "282", recommended_psu_w: "550", boost_clock: "2755 MHz" } },
  { name: "ASRock Radeon RX 7800 XT Challenger 16GB", brand: "ASRock", category: "placas-de-video", price: 989990, compareAt: 1099990, stock: 5, sold: 45, short: "16 GB para 1440p ultra.", specs: { gpu_chip: "Radeon RX 7800 XT", vram: "16 GB GDDR6", length_mm: "266", recommended_psu_w: "700", boost_clock: "2430 MHz" } },
  { name: "MSI GeForce RTX 4080 Super Gaming X Slim 16GB", brand: "MSI", category: "placas-de-video", price: 2199990, stock: 2, minStock: 2, sold: 10, short: "4K de alto rendimiento.", specs: { gpu_chip: "GeForce RTX 4080 Super", vram: "16 GB GDDR6X", length_mm: "322", recommended_psu_w: "850", boost_clock: "2610 MHz" } },
  { name: "Gigabyte GeForce RTX 3050 Windforce 6GB", brand: "Gigabyte", category: "placas-de-video", price: 279990, stock: 0, sold: 130, short: "Entrada a RTX sin conector extra.", specs: { gpu_chip: "GeForce RTX 3050", vram: "6 GB GDDR6", length_mm: "191", recommended_psu_w: "300", boost_clock: "1470 MHz" } },

  // ---------- Almacenamiento ----------
  { name: "Samsung 990 Pro 1TB NVMe", brand: "Samsung", category: "almacenamiento", price: 169990, compareAt: 199990, stock: 20, sold: 170, short: "PCIe 4.0 de máximo rendimiento.", specs: { capacity: "1 TB", interface: "NVMe PCIe 4.0", form_factor: "M.2 2280", read_speed: "7450 MB/s", write_speed: "6900 MB/s" } },
  { name: "WD Blue SN580 1TB NVMe", brand: "Western Digital", category: "almacenamiento", price: 89990, stock: 28, sold: 300, short: "NVMe rápido y accesible.", specs: { capacity: "1 TB", interface: "NVMe PCIe 4.0", form_factor: "M.2 2280", read_speed: "4150 MB/s", write_speed: "4150 MB/s" } },
  { name: "Kingston NV3 2TB NVMe", brand: "Kingston", category: "almacenamiento", price: 159990, stock: 15, sold: 95, short: "2 TB para juegos y archivos.", specs: { capacity: "2 TB", interface: "NVMe PCIe 4.0", form_factor: "M.2 2280", read_speed: "6000 MB/s", write_speed: "5000 MB/s" } },
  { name: "Kingston A400 480GB SATA", brand: "Kingston", category: "almacenamiento", price: 39990, stock: 40, sold: 520, short: "SSD SATA para revivir cualquier PC.", specs: { capacity: "480 GB", interface: "SATA III", form_factor: '2.5"', read_speed: "500 MB/s", write_speed: "450 MB/s" } },
  { name: "Seagate BarraCuda 2TB HDD", brand: "Seagate", category: "almacenamiento", price: 89990, stock: 9, sold: 80, short: "Disco rígido para almacenamiento masivo.", specs: { capacity: "2 TB", interface: "SATA III", form_factor: '3.5"', read_speed: "220 MB/s", write_speed: "220 MB/s" } },

  // ---------- Fuentes ----------
  { name: "Corsair RM750e 750W 80 Plus Gold", brand: "Corsair", category: "fuentes", price: 169990, stock: 14, sold: 140, short: "Full modular, silenciosa.", specs: { wattage: "750", certification: "80 Plus Gold", modular: "Full modular", form_factor: "ATX" } },
  { name: "Cooler Master MWE 650 Bronze V2", brand: "Cooler Master", category: "fuentes", price: 89990, stock: 21, sold: 230, short: "650 W confiables para builds medias.", specs: { wattage: "650", certification: "80 Plus Bronze", modular: "No", form_factor: "ATX" } },
  { name: "be quiet! Pure Power 12 M 850W", brand: "be quiet!", category: "fuentes", price: 229990, compareAt: 259990, stock: 6, sold: 35, short: "ATX 3.0 con conector 12V-2x6.", specs: { wattage: "850", certification: "80 Plus Gold", modular: "Full modular", form_factor: "ATX" } },
  { name: "Thermaltake Smart 500W 80 Plus", brand: "Thermaltake", category: "fuentes", price: 54990, stock: 17, sold: 260, short: "Fuente de entrada certificada.", specs: { wattage: "500", certification: "80 Plus White", modular: "No", form_factor: "ATX" } },
  { name: "ASUS ROG Thor 1000W Platinum II", brand: "ASUS", category: "fuentes", price: 479990, stock: 2, sold: 6, ageDays: 20, short: "1000 W Platinum con display OLED.", specs: { wattage: "1000", certification: "80 Plus Platinum", modular: "Full modular", form_factor: "ATX" } },

  // ---------- Gabinetes ----------
  { name: "Corsair 4000D Airflow", brand: "Corsair", category: "gabinetes", price: 139990, stock: 10, sold: 160, short: "Flujo de aire excelente en mid tower.", specs: { form_factor: "Mid Tower", supported_form_factors: "ATX, Micro-ATX, Mini-ITX", max_gpu_length_mm: "360", max_cooler_height_mm: "170" } },
  { name: "Lian Li Lancool 216", brand: "Lian Li", category: "gabinetes", price: 159990, compareAt: 179990, stock: 7, sold: 70, short: "Dos fans de 160 mm incluidos.", specs: { form_factor: "Mid Tower", supported_form_factors: "E-ATX, ATX, Micro-ATX, Mini-ITX", max_gpu_length_mm: "392", max_cooler_height_mm: "180" } },
  { name: "Cooler Master MasterBox Q300L", brand: "Cooler Master", category: "gabinetes", price: 69990, stock: 13, sold: 190, short: "Compacto y económico.", specs: { form_factor: "Mini Tower", supported_form_factors: "Micro-ATX, Mini-ITX", max_gpu_length_mm: "360", max_cooler_height_mm: "159" } },
  { name: "Thermaltake Core V1 Mini-ITX", brand: "Thermaltake", category: "gabinetes", price: 79990, stock: 4, sold: 20, short: "Cubo Mini-ITX para builds compactas.", specs: { form_factor: "Cubo", supported_form_factors: "Mini-ITX", max_gpu_length_mm: "285", max_cooler_height_mm: "140" } },

  // ---------- Coolers ----------
  { name: "Cooler Master Hyper 212 Black", brand: "Cooler Master", category: "coolers", price: 49990, stock: 24, sold: 280, short: "El cooler de aire más popular.", specs: { cooler_type: "Aire", sockets: "AM5, AM4, LGA1700", height_mm: "159", max_tdp_w: "150" } },
  { name: "Noctua NH-D15 chromax.black", brand: "Noctua", category: "coolers", price: 189990, stock: 5, sold: 30, short: "Doble torre de máxima disipación.", specs: { cooler_type: "Aire", sockets: "AM5, AM4, LGA1700", height_mm: "165", max_tdp_w: "250" } },
  { name: "Corsair iCUE H100i Elite 240mm", brand: "Corsair", category: "coolers", price: 219990, compareAt: 249990, stock: 6, sold: 45, short: "Watercooling AIO de 240 mm.", specs: { cooler_type: "Líquida 240 mm", sockets: "AM5, AM4, LGA1700", height_mm: "52", max_tdp_w: "250" } },
  { name: "Thermaltake UX200 SE ARGB", brand: "Thermaltake", category: "coolers", price: 29990, stock: 18, sold: 150, short: "Cooler compacto con iluminación ARGB.", specs: { cooler_type: "Aire", sockets: "AM4, LGA1700", height_mm: "154", max_tdp_w: "130" } },

  // ---------- Monitores ----------
  { name: 'Samsung Odyssey G5 27" QHD 165Hz', brand: "Samsung", category: "monitores", price: 389990, compareAt: 449990, stock: 9, sold: 120, featured: true, short: "Curvo 1440p para gaming.", specs: { size: '27"', resolution: "2560 x 1440", refresh_rate: "165 Hz", panel: "VA", response_time: "1 ms" } },
  { name: 'LG UltraGear 24GN60R 24" FHD 144Hz', brand: "LG", category: "monitores", price: 219990, stock: 16, sold: 240, short: "IPS rápido para esports.", specs: { size: '24"', resolution: "1920 x 1080", refresh_rate: "144 Hz", panel: "IPS", response_time: "1 ms" } },
  { name: 'ASUS TUF Gaming VG27AQ3A 27" QHD 180Hz', brand: "ASUS", category: "monitores", price: 429990, stock: 6, sold: 55, ageDays: 12, short: "IPS QHD a 180 Hz.", specs: { size: '27"', resolution: "2560 x 1440", refresh_rate: "180 Hz", panel: "IPS", response_time: "1 ms" } },
  { name: 'LG 27UP650 27" 4K UHD', brand: "LG", category: "monitores", price: 499990, stock: 4, sold: 30, short: "4K IPS para diseño y productividad.", specs: { size: '27"', resolution: "3840 x 2160", refresh_rate: "60 Hz", panel: "IPS", response_time: "5 ms" } },
  { name: 'MSI G2412 24" FHD 170Hz', brand: "MSI", category: "monitores", price: 199990, stock: 11, sold: 140, short: "170 Hz a precio de entrada.", specs: { size: '24"', resolution: "1920 x 1080", refresh_rate: "170 Hz", panel: "IPS", response_time: "1 ms" } },
  { name: 'Samsung Odyssey G9 49" DQHD 240Hz', brand: "Samsung", category: "monitores", price: 1899990, stock: 1, minStock: 2, sold: 5, short: "Super ultrawide inmersivo.", specs: { size: '49"', resolution: "5120 x 1440", refresh_rate: "240 Hz", panel: "OLED", response_time: "0.03 ms" } },

  // ---------- Teclados ----------
  { name: "Logitech G Pro X TKL", brand: "Logitech", category: "teclados", price: 229990, stock: 8, sold: 60, short: "TKL inalámbrico para competitivo.", specs: { switch: "GX Brown (táctil)", layout: "TKL", connection: "Inalámbrico / USB" } },
  { name: "Redragon Kumara K552 RGB", brand: "Redragon", category: "teclados", price: 49990, compareAt: 59990, stock: 35, sold: 480, short: "Mecánico TKL accesible.", specs: { switch: "Outemu Red (lineal)", layout: "TKL", connection: "USB" } },
  { name: "HyperX Alloy Origins Core", brand: "HyperX", category: "teclados", price: 109990, stock: 12, sold: 130, short: "Cuerpo de aluminio y switches propios.", specs: { switch: "HyperX Red (lineal)", layout: "TKL", connection: "USB" } },
  { name: "Razer BlackWidow V4 X", brand: "Razer", category: "teclados", price: 169990, stock: 7, sold: 50, short: "Full size con macros dedicadas.", specs: { switch: "Razer Green (clicky)", layout: "Full size", connection: "USB" } },

  // ---------- Mouse ----------
  { name: "Logitech G502 HERO", brand: "Logitech", category: "mouse", price: 59990, compareAt: 69990, stock: 30, sold: 600, featured: true, short: "El mouse gamer más vendido.", specs: { dpi: "25600", connection: "USB", weight: "121 g" } },
  { name: "Logitech G Pro X Superlight 2", brand: "Logitech", category: "mouse", price: 189990, stock: 9, sold: 85, ageDays: 18, short: "60 g para esports.", specs: { dpi: "32000", connection: "Inalámbrico", weight: "60 g" } },
  { name: "Razer DeathAdder Essential", brand: "Razer", category: "mouse", price: 34990, stock: 26, sold: 350, short: "Ergonómico y preciso.", specs: { dpi: "6400", connection: "USB", weight: "96 g" } },
  { name: "Redragon Cobra M711 RGB", brand: "Redragon", category: "mouse", price: 22990, stock: 44, sold: 700, short: "RGB a precio imbatible.", specs: { dpi: "10000", connection: "USB", weight: "120 g" } },

  // ---------- Auriculares ----------
  { name: "HyperX Cloud II", brand: "HyperX", category: "auriculares", price: 99990, compareAt: 119990, stock: 15, sold: 420, short: "Sonido 7.1 y comodidad legendaria.", specs: { connection: "USB / 3.5 mm", driver: "53 mm", microphone: "Desmontable" } },
  { name: "Logitech G435 Lightspeed", brand: "Logitech", category: "auriculares", price: 89990, stock: 10, sold: 160, short: "Livianos e inalámbricos.", specs: { connection: "Inalámbrico / Bluetooth", driver: "40 mm", microphone: "Integrado" } },
  { name: "Razer BlackShark V2 X", brand: "Razer", category: "auriculares", price: 64990, stock: 2, minStock: 4, sold: 210, short: "Competitivo con buen aislamiento.", specs: { connection: "3.5 mm", driver: "50 mm", microphone: "Cardioide" } },
  { name: "Corsair HS80 RGB Wireless", brand: "Corsair", category: "auriculares", price: 179990, stock: 5, sold: 40, short: "Dolby Atmos inalámbrico.", specs: { connection: "Inalámbrico / USB", driver: "50 mm", microphone: "Omnidireccional" } },

  // ---------- Cables ----------
  { name: "Ugreen Cable DisplayPort 1.4 8K 2m", brand: "Ugreen", category: "cables", price: 19990, stock: 50, sold: 230, short: "Hasta 8K 60 Hz / 4K 144 Hz.", specs: { cable_type: "DisplayPort 1.4", cable_length: "2 m" } },
  { name: "Ugreen Cable HDMI 2.1 8K 2m", brand: "Ugreen", category: "cables", price: 17990, stock: 60, sold: 310, short: "48 Gbps para consolas y monitores.", specs: { cable_type: "HDMI 2.1", cable_length: "2 m" } },
  { name: "Ugreen Cable USB-C a USB-C 100W 1m", brand: "Ugreen", category: "cables", price: 12990, stock: 80, sold: 400, short: "Carga rápida y datos.", specs: { cable_type: "USB-C", cable_length: "1 m" } },

  // ---------- Soportes ----------
  { name: "Soporte de monitor a escritorio con brazo a gas", brand: "Ugreen", category: "soportes", price: 59990, stock: 12, sold: 90, short: "Ajuste en altura, giro e inclinación.", specs: { max_monitor_size: '32"', weight: "Hasta 9 kg" } },
  { name: "Soporte doble para monitores", brand: "Ugreen", category: "soportes", price: 99990, stock: 6, sold: 40, short: "Para dos monitores de hasta 27\".", specs: { max_monitor_size: '27"', weight: "Hasta 8 kg por brazo" } },
];
