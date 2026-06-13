import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { getWallets, getTransactions, getUnlinkedInvoices } from '@/app/actions/wallets';
import WalletsManager from './WalletsManager';

export const dynamic = 'force-dynamic';

export default async function WalletsPage() {
  const supabase = await createClient();
  
  // 1. Obtener carteras
  const wallets = await getWallets();

  // 2. Obtener transacciones
  const transactions = await getTransactions();

  // 3. Obtener facturas no vinculadas
  const unlinkedInvoices = await getUnlinkedInvoices();

  // 4. Obtener todas las categorías para transacciones manuales
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 space-y-8 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-brand-carbon dark:text-white tracking-tight">
          Mis Carteras y Efectivo
        </h1>
        <p className="text-sm text-brand-graphite dark:text-zinc-400 mt-1">
          Controla tus cuentas bancarias, consolida tu nómina y registra tus gastos diarios en efectivo.
        </p>
      </div>

      <WalletsManager 
        initialWallets={wallets}
        initialTransactions={transactions}
        initialUnlinkedInvoices={unlinkedInvoices}
        categories={categories || []}
      />
    </div>
  );
}
