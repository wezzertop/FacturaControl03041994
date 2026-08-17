import React from "react";
import { createClient } from "@/utils/supabase/server";
import PageShell from "@/components/layout/PageShell";
import FinancialCalendar from "@/components/calendar/FinancialCalendar";
import { getTransactions, getWallets, getRecurringPayments } from "@/app/actions/wallets";
import { getLoans } from "@/app/actions/loans";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-8 text-center text-sm text-slate-500">No autenticado</div>;
  }

  const [transactions, wallets, loans, recurringPayments, invoicesResponse] = await Promise.all([
    getTransactions(),
    getWallets(),
    getLoans(),
    getRecurringPayments(),
    supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("fecha", { ascending: false }),
  ]);

  const invoices = invoicesResponse.data || [];

  return (
    <PageShell
      eyebrow="Planificación"
      title="Calendario Financiero"
      description="Visualiza el flujo de caja, ingresos, egresos, tarjetas de crédito y compromisos de deuda en un calendario mensual adaptado a México."
    >
      <FinancialCalendar
        invoices={invoices}
        transactions={transactions}
        recurringPayments={recurringPayments}
        wallets={wallets}
        loans={loans}
      />
    </PageShell>
  );
}
