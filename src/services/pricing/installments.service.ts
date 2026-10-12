import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import type { InstallmentPlanInput } from "./rules";

export const getInstallmentPlans = cache(async (): Promise<InstallmentPlanInput[]> => {
  return db.installmentPlan.findMany({
    where: { isActive: true },
    orderBy: { installments: "asc" },
    select: { installments: true, interestRateBps: true },
  });
});

/** Mayor cantidad de cuotas sin interés configurada (para tarjetas de producto). */
export async function getInterestFreeHint(): Promise<{ installments: number } | null> {
  const best = (await getInstallmentPlans())
    .filter((p) => p.interestRateBps === 0 && p.installments > 1)
    .sort((a, b) => b.installments - a.installments)[0];
  return best ? { installments: best.installments } : null;
}
