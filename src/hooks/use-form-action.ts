"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { INITIAL_FORM_STATE, type FormState } from "@/types/actions";

type FormAction<T> = (prev: FormState<T>, formData: FormData) => Promise<FormState<T>>;

/**
 * Igual que useActionState, pero envía con onSubmit para que React no resetee
 * los campos del formulario cuando el servidor devuelve errores de validación.
 */
export function useFormAction<T = void>(action: FormAction<T>) {
  const [state, dispatch, pending] = useActionState(action, INITIAL_FORM_STATE as FormState<T>);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  };
  const errors = state.ok === false ? state.fieldErrors ?? {} : {};
  return { state, pending, onSubmit, errors };
}
