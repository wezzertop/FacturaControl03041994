import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { AlertCircle } from 'lucide-react';
import InvoiceTable from '@/components/invoices/InvoiceTable';
import ExportCSVButton from '@/components/invoices/ExportCSVButton';

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>No autenticado</div>;
  }

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(`
      *,
      categories (name, color, icon)
    `)
    .eq('user_id', user.id)
    .order('fecha', { ascending: false });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-brand-carbon dark:text-white tracking-tight">Historial de Facturas</h2>
          <p className="text-sm text-brand-graphite dark:text-zinc-400 mt-1">
            Revisa todos los comprobantes CFDI procesados y clasificados. Haz clic en una factura para ver el ticket detallado.
          </p>
        </div>
        <ExportCSVButton invoices={(invoices as any[]) || []} />
      </div>

      {error ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">Error al cargar el historial. Por favor, intenta de nuevo.</p>
        </div>
      ) : (
        <InvoiceTable invoices={(invoices as any[]) || []} />
      )}
    </div>
  );
}
