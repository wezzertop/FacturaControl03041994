import React from "react";
import { createClient } from "@/utils/supabase/server";
import { AlertCircle } from "lucide-react";
import InvoiceTable, { type InvoiceTableRow } from "@/components/invoices/InvoiceTable";
import ExportCSVButton from "@/components/invoices/ExportCSVButton";
import PageShell from "@/components/layout/PageShell";

export default async function InvoicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-8 text-center text-sm text-slate-500">No autenticado</div>;
  }

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select(`
      *,
      categories (name, color, icon)
    `)
    .eq("user_id", user.id)
    .order("fecha", { ascending: false });

  const validInvoices = (invoices || []) as InvoiceTableRow[];

  return (
    <PageShell
      eyebrow="CFDI"
      title="Historial de facturas"
      description="Revisa comprobantes procesados, categorías, montos y detalle de cada ticket fiscal."
      actions={<ExportCSVButton invoices={validInvoices} />}
    >
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">Error al cargar el historial. Por favor, intenta de nuevo.</p>
          </div>
        </div>
      ) : (
        <InvoiceTable invoices={validInvoices} />
      )}
    </PageShell>
  );
}

