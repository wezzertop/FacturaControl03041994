import React from "react";
import PageShell from "@/components/layout/PageShell";
import { getWallets } from "@/app/actions/wallets";
import { getCategories } from "@/app/actions/categories";
import { getLoans } from "@/app/actions/loans";
import LoansManager from "@/components/loans/LoansManager";

export const dynamic = "force-dynamic";

export default async function LoansPage() {
  const [wallets, categories, loans] = await Promise.all([
    getWallets(),
    getCategories(),
    getLoans(),
  ]);

  return (
    <PageShell
      eyebrow="Financiamiento"
      title="Préstamos Bancarios"
      description="Gestiona tus créditos personales, visualiza tablas de amortización con IVA y programa cobros automáticos desde nómina."
    >
      <LoansManager
        initialLoans={loans as any[]}
        wallets={wallets}
        categories={categories || []}
      />
    </PageShell>
  );
}
