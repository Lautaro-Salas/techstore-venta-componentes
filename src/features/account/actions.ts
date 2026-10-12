"use server";

import { revalidatePath } from "next/cache";
import { formDataToObject, parseOrThrow, runAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth/guards";
import { addressSchema, profileSchema } from "@/schemas/customer";
import { idSchema } from "@/schemas/common";
import * as account from "@/services/account/account.service";
import type { ActionResult, FormState } from "@/types/actions";

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runAction(async () => {
    const user = await requireUser();
    const raw = formDataToObject(formData);
    const input = parseOrThrow(profileSchema, {
      ...raw,
      marketingOptIn: raw.marketingOptIn === "on",
    });
    await account.updateProfile(user.id, input);
    revalidatePath("/cuenta", "layout");
  });
}

export async function saveAddressAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return runAction(async () => {
    const user = await requireUser();
    const raw = formDataToObject(formData);
    const input = parseOrThrow(addressSchema, raw);
    await account.saveAddress(user.id, input, raw.addressId || undefined);
    revalidatePath("/cuenta/direcciones");
  });
}

export async function deleteAddressAction(addressId: string): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireUser();
    await account.deleteAddress(user.id, parseOrThrow(idSchema, addressId));
    revalidatePath("/cuenta/direcciones");
    return undefined;
  });
}

export async function setDefaultAddressAction(addressId: string): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireUser();
    await account.setDefaultAddress(user.id, parseOrThrow(idSchema, addressId));
    revalidatePath("/cuenta/direcciones");
    return undefined;
  });
}
