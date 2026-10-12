"use client";

import { useRouter } from "next/navigation";
import { useAdminAction } from "@/features/admin/shared/use-admin-action";
import { CONTACT_STATUS_LABEL } from "@/components/admin/labels";
import { CONTACT_STATUSES } from "@/schemas/admin";
import { setContactMessageStatusAction } from "./actions";

const SELECT_CONTROL =
  "border-border bg-surface h-9 rounded-xl border px-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-60";

interface Props {
  messageId: string;
  status: string;
}

/** Selector inline de estado del mensaje (nuevo/leído/respondido). */
export function MessageStatusSelect({ messageId, status }: Props) {
  const router = useRouter();
  const { pending, run } = useAdminAction();

  const change = (next: string) =>
    run(() => setContactMessageStatusAction(messageId, next), {
      success: "Estado actualizado",
      onSuccess: () => router.refresh(),
    });

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => change(e.target.value)}
      className={SELECT_CONTROL}
      aria-label="Cambiar estado del mensaje"
    >
      {CONTACT_STATUSES.map((s) => (
        <option key={s} value={s}>
          {CONTACT_STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
