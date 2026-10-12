"use client";

import { Button } from "@/components/ui/button";
import { Checkbox, Input, Select } from "@/components/ui/field";
import { FormMessage } from "@/features/auth/auth-card";
import { useFormAction } from "@/hooks/use-form-action";
import { updateProfileAction } from "./actions";

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  documentType: string | null;
  documentNumber: string | null;
  marketingOptIn: boolean;
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const { state, pending, onSubmit, errors } = useFormAction(updateProfileAction);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {state.ok === true && (
        <FormMessage tone="success">Tus datos se guardaron correctamente.</FormMessage>
      )}
      {state.ok === false && !state.fieldErrors && (
        <FormMessage tone="error">{state.error}</FormMessage>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="firstName"
          label="Nombre"
          defaultValue={profile.firstName}
          required
          error={errors.firstName}
          autoComplete="given-name"
        />
        <Input
          name="lastName"
          label="Apellido"
          defaultValue={profile.lastName}
          required
          error={errors.lastName}
          autoComplete="family-name"
        />
      </div>
      <Input
        label="Email"
        value={profile.email}
        readOnly
        disabled
        hint="Para cambiar el email, contactanos."
      />
      <Input
        name="phone"
        type="tel"
        label="Teléfono"
        defaultValue={profile.phone ?? ""}
        error={errors.phone}
        autoComplete="tel"
      />
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <Select
          name="documentType"
          label="Documento"
          defaultValue={profile.documentType ?? ""}
          placeholder="-"
          options={[
            { value: "DNI", label: "DNI" },
            { value: "CUIT", label: "CUIT" },
            { value: "CUIL", label: "CUIL" },
          ]}
          error={errors.documentType}
        />
        <Input
          name="documentNumber"
          label="Número"
          inputMode="numeric"
          defaultValue={profile.documentNumber ?? ""}
          error={errors.documentNumber}
        />
      </div>
      <Checkbox
        name="marketingOptIn"
        defaultChecked={profile.marketingOptIn}
        label="Quiero recibir ofertas y novedades por email"
      />
      <Button type="submit" loading={pending} className="self-start">
        Guardar cambios
      </Button>
    </form>
  );
}
