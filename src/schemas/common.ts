import { z } from "zod";

/** Identificador de entidad (Cuid/UUID): única fuente de verdad del proyecto. */
export const idSchema = z.string().min(1).max(40);
