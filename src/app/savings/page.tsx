import React from "react";
import { getSavingsGoals } from "@/app/actions/savings";
import { getWallets } from "@/app/actions/wallets";
import PageShell from "@/components/layout/PageShell";
import SavingsGoalsManager from "@/components/savings/SavingsGoalsManager";

export const dynamic = "force-dynamic";

export default async function SavingsPage() {
  const [goals, wallets] = await Promise.all([
    getSavingsGoals(),
    getWallets()
  ]);

  return (
    <PageShell
      eyebrow="Ahorro Inteligente"
      title="Metas de Ahorro y Apartados"
      description="Separa tu dinero en apartados y calcula tu ahorro mensual para alcanzar tus objetivos sin endeudarte."
    >
      <div className="mx-auto max-w-7xl">
        <SavingsGoalsManager initialGoals={goals} wallets={wallets} />
      </div>
    </PageShell>
  );
}
