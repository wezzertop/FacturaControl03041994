import React from "react";
import RecurringPaymentsManager from "@/components/settings/RecurringPaymentsManager";
import { getCategories } from "@/app/actions/categories";
import { getWallets } from "@/app/actions/wallets";
import PageShell from "@/components/layout/PageShell";

export const dynamic = "force-dynamic";

export default async function RecurringPaymentsPage() {
  const categories = await getCategories();
  const wallets = await getWallets();

  return (
    <PageShell
      eyebrow="Automatización"
      title="Gastos e Ingresos Recurrentes"
      description="Programa pagos automáticos de servicios, nóminas, colegiaturas y suscripciones periódicas."
    >
      <div className="mx-auto max-w-5xl">
        <RecurringPaymentsManager initialCategories={categories} initialWallets={wallets} />
      </div>
    </PageShell>
  );
}
