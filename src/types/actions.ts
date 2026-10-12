export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: string; fieldErrors?: Record<string, string> };

export type FormState<T = void> = ActionResult<T> | { ok: null };

export const INITIAL_FORM_STATE: FormState = { ok: null };
