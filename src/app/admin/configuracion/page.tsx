import type { Metadata } from "next";
import { FilterTabs } from "@/components/admin/filter-tabs";
import { PageHeader } from "@/components/admin/page-header";
import { hrefWith, readParam, type AdminSearchParams } from "@/components/admin/query";
import { PageTransition } from "@/components/navigation/page-transition";
import { requirePermissionPage } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { getPaymentProviderCodes } from "@/services/payments/registry";
import { getStoreSettings } from "@/services/settings/settings.service";
import {
  listInstallmentPlans,
  listPaymentMethods,
  listShippingMethods,
} from "@/services/admin/commerce-config.service";
import { SettingsForm } from "@/features/admin/config/settings-form";
import { ShippingMethodsPanel } from "@/features/admin/config/shipping-methods-panel";
import { PaymentMethodsPanel } from "@/features/admin/config/payment-methods-panel";
import { InstallmentPlansPanel } from "@/features/admin/config/installment-plans-panel";
import type { StoreSettingsFormValues } from "@/schemas/settings";

export const metadata: Metadata = { title: "Configuración" };

const BASE = "/admin/configuracion";

type Section = "general" | "envios" | "pagos" | "cuotas";

function readSection(value: string): Section {
  return value === "envios" || value === "pagos" || value === "cuotas"
    ? value
    : "general";
}

export default async function AdminConfigPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const user = await requirePermissionPage("settings:read", BASE);
  const sp = await searchParams;
  const section = readSection(readParam(sp, "seccion"));
  const canWrite = hasPermission(user, "settings:write");
  const [settings, providerCodes, shipping, payments, installments] =
    await Promise.all([
      getStoreSettings(),
      getPaymentProviderCodes(),
      listShippingMethods(),
      listPaymentMethods(),
      listInstallmentPlans(),
    ]);

  const initial: StoreSettingsFormValues = {
    name: settings.name,
    tagline: settings.tagline,
    logoUrl: settings.logoUrl,
    primaryColor: settings.primaryColor,
    email: settings.email,
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    address: settings.address,
    businessHours: settings.businessHours,
    social: settings.social,
    bank: settings.bank,
    vatRatePercent: String(settings.vatRatePercent),
    showPriceWithoutTaxes: settings.showPriceWithoutTaxes,
    invoiceAEnabled: settings.invoiceAEnabled,
  };

  const tabs = (
    [
      { section: "general", label: "General" },
      { section: "envios", label: "Envíos" },
      { section: "pagos", label: "Pagos" },
      { section: "cuotas", label: "Cuotas" },
    ] as const
  ).map((tab) => ({
    label: tab.label,
    href: hrefWith(BASE, {}, { seccion: tab.section }),
    active: section === tab.section,
  }));

  return (
    <PageTransition>
      <PageHeader
        title="Configuración"
        description="Datos de la tienda, envíos, medios de pago y cuotas."
      />
      <div className="mb-4">
        <FilterTabs tabs={tabs} label="Secciones de configuración" />
      </div>
      {section === "general" && <SettingsForm initial={initial} />}
      {section === "envios" && (
        <ShippingMethodsPanel methods={shipping} canWrite={canWrite} />
      )}
      {section === "pagos" && (
        <PaymentMethodsPanel
          methods={payments}
          providerCodes={providerCodes}
          canWrite={canWrite}
        />
      )}
      {section === "cuotas" && (
        <InstallmentPlansPanel plans={installments} canWrite={canWrite} />
      )}
    </PageTransition>
  );
}
