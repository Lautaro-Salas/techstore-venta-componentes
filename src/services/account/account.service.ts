import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { AddressInput, ProfileInput } from "@/schemas/customer";

export async function getProfile(userId: string) {
  return db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      documentType: true,
      documentNumber: true,
      marketingOptIn: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });
}

export async function updateProfile(userId: string, input: ProfileInput): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone || null,
      documentType: input.documentType || null,
      documentNumber: input.documentType ? input.documentNumber : null,
      marketingOptIn: input.marketingOptIn,
    },
  });
}

export async function listAddresses(userId: string) {
  return db.address.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
}

export async function saveAddress(userId: string, input: AddressInput, addressId?: string): Promise<void> {
  if (addressId) {
    const existing = await db.address.findFirst({ where: { id: addressId, userId } });
    if (!existing) throw new AppError("NOT_FOUND", "Dirección no encontrada.");
    await db.address.update({ where: { id: addressId }, data: input });
    return;
  }
  const count = await db.address.count({ where: { userId } });
  await db.address.create({ data: { ...input, userId, isDefault: count === 0 } });
}

export async function deleteAddress(userId: string, addressId: string): Promise<void> {
  const address = await db.address.findFirst({ where: { id: addressId, userId } });
  if (!address) throw new AppError("NOT_FOUND", "Dirección no encontrada.");
  await db.address.delete({ where: { id: addressId } });
  if (address.isDefault) {
    const next = await db.address.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
    if (next) await db.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
}

export async function setDefaultAddress(userId: string, addressId: string): Promise<void> {
  const address = await db.address.findFirst({ where: { id: addressId, userId } });
  if (!address) throw new AppError("NOT_FOUND", "Dirección no encontrada.");
  await db.$transaction([
    db.address.updateMany({ where: { userId }, data: { isDefault: false } }),
    db.address.update({ where: { id: addressId }, data: { isDefault: true } }),
  ]);
}
