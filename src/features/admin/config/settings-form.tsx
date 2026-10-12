"use client";

import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Checkbox, Input } from "@/components/ui/field";
import { useSchemaForm } from "@/features/admin/shared/use-schema-form";
import {
  storeSettingsFormSchema,
  type StoreSettingsFormValues,
} from "@/schemas/settings";
import { saveStoreSettingsAction } from "./actions";

interface Props {
  initial: StoreSettingsFormValues;
}

/** Formulario de configuración general de la tienda. */
export function SettingsForm({ initial }: Props) {
  const router = useRouter();
  const { values, set, errors, pending, handleSubmit } = useSchemaForm<
    StoreSettingsFormValues,
    void
  >({
    schema: storeSettingsFormSchema,
    initial,
    submit: (formValues) => saveStoreSettingsAction(formValues),
    successMessage: "Configuración guardada",
    onSuccess: () => router.refresh(),
  });

  const social = (key: "instagram" | "facebook" | "tiktok" | "youtube", value: string) =>
    set("social", { ...values.social, [key]: value });
  const bank = (key: "bankName" | "holder" | "cuit" | "cbu" | "alias", value: string) =>
    set("bank", { ...values.bank, [key]: value });

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Card>
        <CardHeader title="Información de la tienda" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nombre"
            required
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            error={errors.name}
            maxLength={60}
          />
          <Input
            label="Eslogan"
            value={values.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            error={errors.tagline}
            maxLength={120}
          />
          <Input
            label="Logo (URL)"
            value={values.logoUrl}
            onChange={(e) => set("logoUrl", e.target.value)}
            error={errors.logoUrl}
            maxLength={300}
            placeholder="https://…"
          />
          <Input
            label="Color primario"
            value={values.primaryColor}
            onChange={(e) => set("primaryColor", e.target.value)}
            error={errors.primaryColor}
            hint="Hexadecimal, ej: #2563EB"
            maxLength={7}
          />
          <Input
            label="Email de contacto"
            type="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            error={errors.email}
          />
          <Input
            label="Teléfono"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            error={errors.phone}
            maxLength={40}
          />
          <Input
            label="WhatsApp (número)"
            value={values.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
            error={errors.whatsapp}
            hint="Solo dígitos con código de país (ej: 5491112345678)"
            maxLength={15}
          />
          <Input
            label="Dirección"
            value={values.address}
            onChange={(e) => set("address", e.target.value)}
            error={errors.address}
            maxLength={200}
          />
          <Input
            label="Horario"
            value={values.businessHours}
            onChange={(e) => set("businessHours", e.target.value)}
            error={errors.businessHours}
            maxLength={200}
            placeholder="Lun a Vie 9-18 hs"
          />
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Redes sociales" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Instagram"
            value={values.social.instagram}
            onChange={(e) => social("instagram", e.target.value)}
            error={errors["social.instagram"]}
            placeholder="https://instagram.com/…"
          />
          <Input
            label="Facebook"
            value={values.social.facebook}
            onChange={(e) => social("facebook", e.target.value)}
            error={errors["social.facebook"]}
            placeholder="https://facebook.com/…"
          />
          <Input
            label="TikTok"
            value={values.social.tiktok}
            onChange={(e) => social("tiktok", e.target.value)}
            error={errors["social.tiktok"]}
            placeholder="https://tiktok.com/…"
          />
          <Input
            label="YouTube"
            value={values.social.youtube}
            onChange={(e) => social("youtube", e.target.value)}
            error={errors["social.youtube"]}
            placeholder="https://youtube.com/…"
          />
        </CardBody>
      </Card>
      <Card>
        <CardHeader
          title="Transferencia bancaria"
          description="Se muestra al elegir pago por transferencia."
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Banco"
            value={values.bank.bankName}
            onChange={(e) => bank("bankName", e.target.value)}
            error={errors["bank.bankName"]}
            maxLength={80}
          />
          <Input
            label="Titular"
            value={values.bank.holder}
            onChange={(e) => bank("holder", e.target.value)}
            error={errors["bank.holder"]}
            maxLength={120}
          />
          <Input
            label="CUIT"
            value={values.bank.cuit}
            onChange={(e) => bank("cuit", e.target.value)}
            error={errors["bank.cuit"]}
            maxLength={20}
          />
          <Input
            label="CBU/CVU"
            value={values.bank.cbu}
            onChange={(e) => bank("cbu", e.target.value)}
            error={errors["bank.cbu"]}
            hint="22 dígitos"
            maxLength={22}
          />
          <Input
            label="Alias"
            value={values.bank.alias}
            onChange={(e) => bank("alias", e.target.value)}
            error={errors["bank.alias"]}
            maxLength={40}
          />
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Impuestos y facturación" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input
            label="IVA (%)"
            required
            inputMode="numeric"
            value={values.vatRatePercent}
            onChange={(e) => set("vatRatePercent", e.target.value)}
            error={errors.vatRatePercent}
            hint="Se aplica para mostrar el precio sin impuestos"
          />
          <Checkbox
            label="Mostrar precios sin impuestos"
            checked={values.showPriceWithoutTaxes}
            onChange={(e) => set("showPriceWithoutTaxes", e.target.checked)}
          />
          <Checkbox
            label="Habilitar facturación A"
            checked={values.invoiceAEnabled}
            onChange={(e) => set("invoiceAEnabled", e.target.checked)}
          />
        </CardBody>
      </Card>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={pending}
          icon={<Save className="size-4" aria-hidden />}
        >
          Guardar configuración
        </Button>
      </div>
    </form>
  );
}
