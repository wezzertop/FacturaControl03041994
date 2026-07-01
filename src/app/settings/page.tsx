import React from "react";
import RFCManager from "@/components/settings/RFCManager";
import CategoryManager from "@/components/settings/CategoryManager";
import SystemResetManager from "@/components/settings/SystemResetManager";
import RecurringPaymentsManager from "@/components/settings/RecurringPaymentsManager";
import { getCategories } from "@/app/actions/categories";
import { getWallets } from "@/app/actions/wallets";
import PageShell from "@/components/layout/PageShell";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const categories = await getCategories();
  const wallets = await getWallets();

  return (
    <PageShell
      eyebrow="Preferencias"
      title="Configuración"
      description="Gestiona tu identidad fiscal, categorías y reglas de organización para mantener tu información consistente."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <RFCManager />
            <SystemResetManager />
          </div>
          <CategoryManager initialCategories={categories} />
        </div>

        <RecurringPaymentsManager initialCategories={categories} initialWallets={wallets} />
      </div>
    </PageShell>
  );
}
