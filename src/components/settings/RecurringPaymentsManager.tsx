"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { 
  Calendar, 
  DollarSign, 
  Wallet as WalletIcon, 
  Tag, 
  Clock, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Power, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw 
} from 'lucide-react';
import { 
  getRecurringPayments, 
  createRecurringPayment, 
  updateRecurringPayment, 
  deleteRecurringPayment,
  executeRecurringPaymentNow,
  toggleRecurringPaymentActive
} from '@/app/actions/wallets';
import { Sparkles, Zap } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
}

interface Wallet {
  id: string;
  name: string;
  type: string;
}

interface RecurringPayment {
  id: string;
  wallet_id: string;
  type: 'income' | 'expense';
  amount: number;
  concept: string;
  category_id: string | null;
  frequency: 'days_14' | 'days_15' | 'monthly' | 'weekly' | 'yearly';
  start_date: string;
  next_execution_date: string;
  is_active: boolean;
  wallets?: { name: string } | null;
  categories?: { name: string; color?: string | null; icon?: string | null } | null;
}

interface RecurringPaymentsManagerProps {
  initialCategories: Category[];
  initialWallets: Wallet[];
}

export default function RecurringPaymentsManager({ initialCategories, initialWallets }: RecurringPaymentsManagerProps) {
  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<RecurringPayment | null>(null);

  // Form states
  const [concept, setConcept] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState<'days_14' | 'days_15' | 'monthly' | 'weekly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextExecutionDate, setNextExecutionDate] = useState(new Date().toISOString().split('T')[0]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const data = await getRecurringPayments();
      setPayments(data as any[]);
    } catch (err) {
      console.error('Error al cargar pagos recurrentes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteNow = async (paymentId: string, conceptName: string) => {
    if (!confirm(`¿Deseas registrar en este momento el movimiento de "${conceptName}" en tu cartera?`)) return;

    startTransition(async () => {
      const res = await executeRecurringPaymentNow(paymentId);
      if (res.success) {
        setSuccessMessage(`¡Movimiento "${conceptName}" registrado exitosamente en tu historial!`);
        loadPayments();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        alert(res.error || 'Error al ejecutar el pago recurrente');
      }
    });
  };

  const handleToggleActive = async (p: RecurringPayment) => {
    startTransition(async () => {
      const res = await toggleRecurringPaymentActive(p.id, !p.is_active);
      if (res.success) {
        loadPayments();
      } else {
        alert('No se pudo cambiar el estado de la suscripción.');
      }
    });
  };

  const openAddModal = () => {
    setEditingPayment(null);
    setConcept('');
    setType('expense');
    setAmount('');
    setWalletId(initialWallets[0]?.id || '');
    setCategoryId(initialCategories[0]?.id || '');
    setFrequency('monthly');
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setNextExecutionDate(today);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: RecurringPayment) => {
    setEditingPayment(p);
    setConcept(p.concept);
    setType(p.type);
    setAmount(p.amount.toString());
    setWalletId(p.wallet_id);
    setCategoryId(p.category_id || '');
    setFrequency(p.frequency);
    setStartDate(p.start_date);
    setNextExecutionDate(p.next_execution_date);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) {
      setErrorMessage('El concepto no puede estar vacío.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setErrorMessage('Ingresa un monto válido mayor a 0.');
      return;
    }
    if (!walletId) {
      setErrorMessage('Selecciona una cartera asociada.');
      return;
    }

    setErrorMessage(null);

    const payload = {
      wallet_id: walletId,
      type,
      amount: Number(amount),
      concept: concept.trim(),
      category_id: categoryId || null,
      frequency,
      start_date: startDate,
      next_execution_date: nextExecutionDate
    };

    startTransition(async () => {
      let res;
      if (editingPayment) {
        res = await updateRecurringPayment(editingPayment.id, {
          ...payload,
          is_active: editingPayment.is_active
        });
      } else {
        res = await createRecurringPayment(payload);
      }

      if (res.success) {
        setIsModalOpen(false);
        loadPayments();
      } else {
        setErrorMessage(res.error || 'Ocurrió un error al guardar.');
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta programación de pago recurrente?')) return;

    const res = await deleteRecurringPayment(id);
    if (res.success) {
      loadPayments();
    } else {
      alert(res.error || 'Error al eliminar');
    }
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'days_14': return 'Catorcenal (14 días)';
      case 'days_15': return 'Quincenal (15 y fin de mes)';
      case 'every_15_days': return 'Cada 15 días exactos';
      case 'monthly': return 'Mensual';
      case 'weekly': return 'Semanal';
      case 'yearly': return 'Anual';
      default: return freq;
    }
  };

  const totalMonthlyCommitment = payments
    .filter(p => p.is_active && p.type === 'expense')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Resumen Superior */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between bg-white dark:bg-[#0A0A0C]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Programaciones</p>
            <p className="text-2xl font-black text-white mt-1">{payments.length}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">{payments.filter(p => p.is_active).length} activas</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between bg-white dark:bg-[#0A0A0C]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Gasto Fijo Mensual Estimado</p>
            <p className="text-2xl font-black text-rose-400 mt-1">
              ${totalMonthlyCommitment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Suscripciones y servicios activos</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm font-bold text-emerald-300">{successMessage}</p>
        </div>
      )}

      {/* Main Container */}
      <div className="surface-card rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-6 bg-white dark:bg-[#0A0A0C] space-y-6">
        
        {/* Title block */}
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-white" />
            Suscripciones y Pagos Periódicos
          </h3>
          <button
            type="button"
            onClick={openAddModal}
            className="px-3.5 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Nueva Programación
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <RefreshCw className="w-6 h-6 text-white animate-spin" />
            <p className="text-xs text-zinc-400">Cargando tus programaciones...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 dark:border-white/[0.08] rounded-2xl">
            <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-zinc-400">No tienes programaciones activas.</p>
            <p className="text-[10px] text-zinc-500 mt-1">Crea una para automatizar tus cargos de Spotify, Netflix o nóminas.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => (
              <div 
                key={p.id}
                className={`p-4 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  p.is_active 
                    ? 'border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#141418]' 
                    : 'border-slate-200/50 dark:border-white/[0.04] bg-slate-50/50 dark:bg-[#0A0A0C] opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    p.type === 'income' 
                      ? 'bg-emerald-500/15 text-emerald-400' 
                      : 'bg-white/10 text-white'
                  }`}>
                    {p.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{p.concept}</span>
                      {p.categories && (
                        <span 
                          className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                          style={{ 
                            backgroundColor: `${p.categories.color || '#ffffff'}20`, 
                            color: p.categories.color || '#ffffff' 
                          }}
                        >
                          {p.categories.name}
                        </span>
                      )}
                      {!p.is_active && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
                          Pausada
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-zinc-400 mt-1">
                      <span className="flex items-center gap-1">
                        <WalletIcon className="w-3.5 h-3.5 text-zinc-500" />
                        {p.wallets?.name || 'Desconocida'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        {getFrequencyLabel(p.frequency)}
                      </span>
                      <span className="flex items-center gap-1 font-bold text-white">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        Próximo: {new Date(p.next_execution_date + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0">
                  <span className={`text-sm font-black ${
                    p.type === 'income' ? 'text-emerald-400' : 'text-slate-900 dark:text-white'
                  }`}>
                    {p.type === 'income' ? '+' : '-'}${p.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Botón Ejecutar Ahora */}
                    <button
                      type="button"
                      onClick={() => handleExecuteNow(p.id, p.concept)}
                      title="Registrar cobro en este momento"
                      className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition"
                    >
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px]">Ejecutar</span>
                    </button>

                    {/* Pausar / Reactivar */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(p)}
                      title={p.is_active ? "Pausar regla" : "Activar regla"}
                      className={`p-2 rounded-xl border transition ${
                        p.is_active 
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                          : 'border-white/10 text-zinc-500 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(p)}
                      className="p-2 rounded-xl border border-white/[0.08] hover:bg-white/10 text-zinc-400 hover:text-white transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="p-2 rounded-xl border border-rose-500/20 hover:bg-rose-500/15 text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 border border-gray-250 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                {editingPayment ? 'Editar Programación Recurrente' : 'Nueva Programación Recurrente'}
              </h4>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl p-3 flex gap-2 items-center text-xs text-red-700 dark:text-red-400 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5 col-span-2">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Concepto</label>
                  <input
                    type="text"
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    placeholder="Ej. Netflix, Renta, Nómina de la quincena"
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                    required
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Tipo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                  >
                    <option value="expense">Gasto / Cargo</option>
                    <option value="income">Ingreso / Abono</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Monto ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0.01"
                      className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Cartera Asociada</label>
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                    required
                  >
                    {initialWallets.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.type === 'cash' ? 'Efectivo' : w.type === 'debit' ? 'Débito' : 'Crédito'})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Categoría</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                  >
                    <option value="">Sin Categoría</option>
                    {initialCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Frecuencia de Recurrencia</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                  >
                    <option value="weekly">Semanal (Cada 7 días)</option>
                    <option value="days_14">Catorcenal (Cada 14 días exactos)</option>
                    <option value="days_15">Quincenal Calendario (Día 15 y Fin de Mes)</option>
                    <option value="every_15_days">Cada 15 días exactos (conteo por días)</option>
                    <option value="monthly">Mensual (Día fijo de mes)</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Fecha del Próximo Registro</label>
                  <input
                    type="date"
                    value={nextExecutionDate}
                    onChange={(e) => setNextExecutionDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-zinc-900 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 border border-gray-200 dark:border-zinc-800 text-xs font-semibold rounded-xl text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  className="px-5 py-2 bg-brand-cerulean hover:bg-brand-cerulean/90 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-sm"
                >
                  {isPending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Guardar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
