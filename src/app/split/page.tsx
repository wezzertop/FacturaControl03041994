import React from "react";
import { getSharedExpenses } from "@/app/actions/split";
import { getWallets } from "@/app/actions/wallets";
import PageShell from "@/components/layout/PageShell";
import SharedExpensesManager from "@/components/split/SharedExpensesManager";

export const dynamic = "force-dynamic";

export default async function SplitPage() {
  const [expenses, wallets] = await Promise.all([
    getSharedExpenses(),
    getWallets()
  ]);

  return (
    <PageShell
      eyebrow="Finanzas en Pareja & Amigos"
      title="Gastos Compartidos & Cuentas Divididas"
      description="Divide gastos en pareja, salidas o viajes y salda cuentas pendientes con un solo toque sin fricción."
    >
      <div className="mx-auto max-w-7xl">
        <SharedExpensesManager initialExpenses={expenses} wallets={wallets} />
      </div>
    </PageShell>
  );
}
