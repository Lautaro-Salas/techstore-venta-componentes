import { describe, expect, it } from "vitest";
import { idSchema } from "@/schemas/common";

describe("idSchema", () => {
  it("acepta identificadores de entidad (cuid/uuid)", () => {
    expect(idSchema.safeParse("cm3abc123xyz").success).toBe(true);
    expect(idSchema.safeParse("d290f1ee-6c54-4b01-90e6-d701748f0851").success).toBe(true);
    expect(idSchema.safeParse("a".repeat(40)).success).toBe(true);
  });

  it("rechaza vacíos y largos mayores a 40", () => {
    expect(idSchema.safeParse("").success).toBe(false);
    expect(idSchema.safeParse("a".repeat(41)).success).toBe(false);
  });
});
