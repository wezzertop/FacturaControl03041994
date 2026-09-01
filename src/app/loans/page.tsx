import React from "react";
import PageShell from "@/components/layout/PageShell";
import { getWallets } from "@/app/actions/wallets";
import { getCategories } from "@/app/actions/categories";
import { getLoans } from "@/app/actions/loans";
import LoansManager from "@/components/loans/LoansManager";
import DebtPayoffSimulator from "@/components/loans/DebtPayoffSimulator";

export const dynamic = "force-dynamic";

export default async function LoansPage() {
  const [wallets, categories, loans] = await Promise.all([
    getWallets(),
    getCategories(),
    getLoans(),
  ]);

  return (
    <PageShell
      eyebrow="Financiamiento & Deudas"
      title="Préstamos & Estrategia de Deuda"
      description="Gestiona tus créditos personales, visualiza tablas de amortización y simula liquidaciones aceleradas (Avalancha y Bola de Nieve)."
    >
      <div className="space-y-8">
        {/* Simulador de Estrategia Pro de Liquidación de Deudas */}
        <DebtPayoffSimulator loans={loans as any[]} creditWallets={wallets.filter((w: any) => w.type === 'credit')} />

        {/* Gestor de Préstamos y Tablas de Amortización */}
        <LoansManager
          initialLoans={loans as any[]}
          wallets={wallets}
          categories={categories || []}
        />
      </div>
    </PageShell>
  );
}
