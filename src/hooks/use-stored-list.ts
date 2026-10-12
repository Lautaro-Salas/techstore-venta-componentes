"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Lista persistida en localStorage, sincronizada entre componentes y pestañas.
 * Útil para comparador y productos vistos recientemente.
 */
const listeners = new Map<string, Set<() => void>>();
const EMPTY: string[] = [];
const snapshots = new Map<string, { raw: string | null; value: string[] }>();

function read(key: string): string[] {
  const raw = window.localStorage.getItem(key);
  const cached = snapshots.get(key);
  if (cached && cached.raw === raw) return cached.value;
  let value: string[] = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    value = Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : EMPTY;
  } catch {
    value = EMPTY;
  }
  snapshots.set(key, { raw, value });
  return value;
}

function emit(key: string) {
  listeners.get(key)?.forEach((l) => l());
}

export function useStoredList(key: string) {
  const subscribe = useCallback(
    (callback: () => void) => {
      const set = listeners.get(key) ?? new Set();
      set.add(callback);
      listeners.set(key, set);
      const onStorage = (e: StorageEvent) => e.key === key && callback();
      window.addEventListener("storage", onStorage);
      return () => {
        set.delete(callback);
        window.removeEventListener("storage", onStorage);
      };
    },
    [key],
  );

  const items = useSyncExternalStore(subscribe, () => read(key), () => EMPTY);

  const setItems = useCallback(
    (update: (current: string[]) => string[]) => {
      window.localStorage.setItem(key, JSON.stringify(update(read(key))));
      emit(key);
    },
    [key],
  );

  return [items, setItems] as const;
}
