import type { Metadata } from "next";
import { MailWarning } from "lucide-react";
import { FilterTabs } from "@/components/admin/filter-tabs";
import { PageHeader } from "@/components/admin/page-header";
import {
  hrefWith,
  readPage,
  readParam,
  type AdminSearchParams,
} from "@/components/admin/query";
import { SearchForm } from "@/components/admin/search-form";
import { StatCard } from "@/components/admin/stat-card";
import { PageTransition } from "@/components/navigation/page-transition";
import { Pagination } from "@/components/ui/pagination";
import { requirePermissionPage } from "@/lib/auth/guards";
import { MessagesTable } from "@/features/admin/messages/messages-table";
import {
  getMessageCounts,
  listContactMessages,
} from "@/services/admin/messages.service";
import { CONTACT_STATUS_LABEL } from "@/components/admin/labels";
import { CONTACT_STATUSES } from "@/schemas/admin";
import { readContactStatus } from "@/app/admin/_lib/filters";

export const metadata: Metadata = { title: "Mensajes" };

const BASE = "/admin/mensajes";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  await requirePermissionPage("messages:read", BASE);
  const sp = await searchParams;
  const filters = {
    q: readParam(sp, "q"),
    estado: readParam(sp, "estado"),
    motivo: readParam(sp, "motivo"),
  };
  const status = readContactStatus(filters.estado);
  const [result, counts] = await Promise.all([
    listContactMessages({
      q: filters.q,
      status,
      reason: filters.motivo || undefined,
      page: readPage(sp),
    }),
    getMessageCounts(),
  ]);

  const tabs = [
    {
      label: "Todos",
      href: hrefWith(BASE, filters, { estado: undefined, pagina: undefined }),
      active: !status,
    },
    ...CONTACT_STATUSES.map((s) => ({
      label: CONTACT_STATUS_LABEL[s],
      href: hrefWith(BASE, filters, { estado: s, pagina: undefined }),
      active: status === s,
    })),
  ];

  return (
    <PageTransition>
      <PageHeader
        title="Mensajes"
        description={`${result.total} mensajes de contacto`}
      />
      <section
        aria-label="Resumen de mensajes"
        className="mb-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2"
      >
        <StatCard
          label="Sin leer"
          value={String(counts.unread)}
          hint="Esperan respuesta"
          icon={<MailWarning />}
          tone={counts.unread > 0 ? "warning" : "success"}
          href={hrefWith(BASE, {}, { estado: "NEW" })}
        />
        <StatCard
          label="Total"
          value={String(counts.total)}
          hint="Todos los mensajes"
          icon={<MailWarning />}
          tone="primary"
        />
      </section>
      <div className="mb-4 flex flex-col gap-3">
        <SearchForm
          action={BASE}
          defaultValue={filters.q}
          placeholder="Buscar por nombre, email o mensaje"
          label="Buscar mensajes"
          hidden={{ estado: filters.estado, motivo: filters.motivo }}
        />
        <FilterTabs tabs={tabs} label="Filtrar por estado" />
      </div>
      <MessagesTable messages={result.items} />
      <div className="mt-6">
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          hrefFor={(p) => hrefWith(BASE, filters, { pagina: p })}
        />
      </div>
    </PageTransition>
  );
}
