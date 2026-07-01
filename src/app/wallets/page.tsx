import React from "react";
import { createClient } from "@/utils/supabase/server";
import { getWallets, getTransactions, getUnlinkedInvoices } from "@/app/actions/wallets";
import { getCategories } from "@/app/actions/categories";
import PageShell from "@/components/layout/PageShell";
import WalletsManager from "./WalletsManager";
import OnboardingWizard from "@/components/dashboard/OnboardingWizard";

export const dynamic = "force-dynamic";

export default async function WalletsPage() {
  await createClient();
  const [wallets, transactions, unlinkedInvoices, categories] = await Promise.all([
    getWallets(),
    getTransactions(),
    getUnlinkedInvoices(),
    getCategories(),
  ]);

  const hasWallets = wallets && wallets.length > 0;

  return (
    <PageShell
      eyebrow="Cuentas y efectivo"
      title="Mis carteras"
      description="Controla cuentas bancarias, consolida nómina y registra gastos diarios en efectivo."
    >
      {hasWallets ? (
        <WalletsManager
          initialWallets={wallets}
          initialTransactions={transactions}
          initialUnlinkedInvoices={unlinkedInvoices}
          categories={categories || []}
        />
      ) : (
        <OnboardingWizard />
      )}
    </PageShell>
  );
}
