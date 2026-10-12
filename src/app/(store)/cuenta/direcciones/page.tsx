import type { Metadata } from "next";
import { PageTransition } from "@/components/navigation/page-transition";
import { AddressManager } from "@/features/account/address-manager";
import { requireUserPage } from "@/lib/auth/guards";
import type { Province } from "@/lib/argentina";
import { listAddresses } from "@/services/account/account.service";

export const metadata: Metadata = { title: "Direcciones" };

export default async function AddressesPage() {
  const user = await requireUserPage("/cuenta/direcciones");
  const addresses = await listAddresses(user.id);
  return (
    <PageTransition>
      <AddressManager
        addresses={addresses.map((a) => ({
          id: a.id,
          isDefault: a.isDefault,
          label: a.label ?? "",
          recipientName: a.recipientName,
          phone: a.phone,
          street: a.street,
          number: a.number,
          floor: a.floor ?? "",
          apartment: a.apartment ?? "",
          city: a.city,
          province: a.province as Province,
          postalCode: a.postalCode,
          notes: a.notes ?? "",
        }))}
      />
    </PageTransition>
  );
}
