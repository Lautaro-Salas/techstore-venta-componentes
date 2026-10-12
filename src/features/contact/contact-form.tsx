"use client";

import { useActionState, useRef, useState, type ChangeEvent } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { contactAction } from "@/features/engagement/actions";
import { CONTACT_REASONS, type ContactReasonKey } from "@/schemas/contact";
import { INITIAL_FORM_STATE } from "@/types/actions";

const REASON_OPTIONS = (Object.keys(CONTACT_REASONS) as ContactReasonKey[]).map((key) => ({
  value: key,
  label: CONTACT_REASONS[key],
}));

const NAME_MAX = 100;
const PHONE_MAX = 30;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 2000;

const EMPTY_VALUES = { name: "", email: "", phone: "", reason: "", message: "" };
type ContactValues = typeof EMPTY_VALUES;

/** Campo trampa para bots: invisible para personas y lectores de pantalla. */
function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label htmlFor="contact-website">No completar este campo</label>
      <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
    </div>
  );
}

function SuccessMessage({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl bg-success-soft p-5" role="status">
      <CheckCircle2 className="size-8 text-success" aria-hidden />
      <div>
        <p className="font-semibold text-success">¡Gracias! Recibimos tu mensaje.</p>
        <p className="mt-1 text-sm text-muted">Te vamos a responder al email que nos dejaste lo antes posible.</p>
      </div>
      <Button variant="outline" size="sm" onClick={onReset}>Enviar otro mensaje</Button>
    </div>
  );
}

export function ContactForm() {
  const [state, action, pending] = useActionState(contactAction, INITIAL_FORM_STATE);
  const [values, setValues] = useState<ContactValues>(EMPTY_VALUES);
  const [sent, setSent] = useState(false);
  const [handledState, setHandledState] = useState(state);
  // Marca de tiempo del montaje del formulario (control anti-spam). Vive en un ref
  // —no en el DOM— para que ningún re-render al tipear la borre, y se inyecta en el
  // FormData al enviar, así el input nunca puede quedar vacío. Se sella en el commit
  // del form (ref callback), no durante el render.
  const startedAt = useRef(0);
  const errors = state.ok === false ? state.fieldErrors ?? {} : {};

  const sealStartedAt = () => {
    if (startedAt.current === 0) startedAt.current = Date.now();
  };

  const submit = (formData: FormData) => {
    if (!formData.get("startedAt")) {
      formData.set("startedAt", String(startedAt.current || Date.now()));
    }
    action(formData);
  };

  // Al recibir un resultado exitoso nuevo: limpiamos campos y mostramos la confirmación.
  if (state !== handledState) {
    setHandledState(state);
    if (state.ok === true) {
      setValues(EMPTY_VALUES);
      setSent(true);
    }
  }

  const reset = () => {
    startedAt.current = 0;
    setSent(false);
  };

  const update = (field: keyof ContactValues) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((prev) => ({ ...prev, [field]: event.target.value }));

  if (sent) return <SuccessMessage onReset={reset} />;

  return (
    <form action={submit} ref={sealStartedAt} className="relative flex flex-col gap-4" noValidate>
      <Honeypot />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="name" label="Nombre" required autoComplete="name" maxLength={NAME_MAX} value={values.name} onChange={update("name")} error={errors.name} />
        <Input name="email" type="email" label="Email" required autoComplete="email" inputMode="email" value={values.email} onChange={update("email")} error={errors.email} />
        <Input name="phone" type="tel" label="Teléfono (opcional)" autoComplete="tel" inputMode="tel" maxLength={PHONE_MAX} value={values.phone} onChange={update("phone")} error={errors.phone} />
        <Select name="reason" label="Motivo" required placeholder="Elegí un motivo" options={REASON_OPTIONS} value={values.reason} onChange={update("reason")} error={errors.reason} />
      </div>
      <Textarea
        name="message"
        label="Mensaje"
        required
        rows={6}
        minLength={MESSAGE_MIN}
        maxLength={MESSAGE_MAX}
        value={values.message}
        onChange={update("message")}
        error={errors.message}
        hint="Si tu consulta es por un pedido, incluí el número de orden."
      />
      {state.ok === false && !state.fieldErrors && (
        <p className="rounded-xl bg-danger-soft p-3 text-sm font-medium text-danger" role="alert">{state.error}</p>
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">Usamos tus datos solo para responder tu consulta.</p>
        <Button type="submit" loading={pending} icon={<Send className="size-4" aria-hidden />} className="sm:self-end">
          Enviar mensaje
        </Button>
      </div>
    </form>
  );
}
