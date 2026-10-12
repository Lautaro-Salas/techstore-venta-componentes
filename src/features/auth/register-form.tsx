"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox, Input } from "@/components/ui/field";
import { useFormAction } from "@/hooks/use-form-action";
import { PASSWORD_MIN_LENGTH } from "@/schemas/auth";
import { registerAction } from "./actions";
import { FormMessage } from "./auth-card";
import { PasswordInput } from "./password-input";

export function RegisterForm({ next }: { next?: string }) {
  const { state, pending, onSubmit, errors } = useFormAction(registerAction);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {state.ok === false && !state.fieldErrors && <FormMessage tone="error">{state.error}</FormMessage>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="firstName" label="Nombre" autoComplete="given-name" required error={errors.firstName} />
        <Input name="lastName" label="Apellido" autoComplete="family-name" required error={errors.lastName} />
      </div>
      <Input name="email" type="email" label="Email" autoComplete="email" required error={errors.email} />
      <PasswordInput name="password" label="Contraseña" autoComplete="new-password" required error={errors.password} hint={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres, con letras y números.`} />
      <PasswordInput name="confirmPassword" label="Repetí la contraseña" autoComplete="new-password" required error={errors.confirmPassword} />
      <div>
        <Checkbox
          name="acceptTerms"
          label={<>Acepto los <Link href="/legales/terminos" target="_blank" className="font-medium text-primary hover:underline">términos y condiciones</Link> y la <Link href="/legales/privacidad" target="_blank" className="font-medium text-primary hover:underline">política de privacidad</Link>.</>}
        />
        {errors.acceptTerms && <p className="mt-1 text-xs font-medium text-danger" role="alert">{errors.acceptTerms}</p>}
      </div>
      <Button type="submit" size="lg" fullWidth loading={pending}>Crear cuenta</Button>
    </form>
  );
}
