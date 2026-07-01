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
  deleteRecurringPayment 
} from '@/app/actions/wallets';

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

  const handleToggleActive = async (p: RecurringPayment) => {
    const res = await updateRecurringPayment(p.id, {
      wallet_id: p.wallet_id,
      type: p.type,
      amount: p.amount,
      concept: p.concept,
      category_id: p.category_id,
      frequency: p.frequency,
      start_date: p.start_date,
      next_execution_date: p.next_execution_date,
      is_active: !p.is_active
    });

    if (res.success) {
      loadPayments();
    } else {
      alert('No se pudo cambiar el estado de la programación.');
    }
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'days_14': return 'Cada 14 días';
      case 'days_15': return 'Cada 15 días';
      case 'monthly': return 'Mensual';
      case 'weekly': return 'Semanal';
      case 'yearly': return 'Anual';
      default: return freq;
    }
  };

  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/50 p-6 md:p-8 shadow-sm">
      
      {/* Title block */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-bold text-brand-carbon dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-brand-cerulean" />
          Gastos e Ingresos Recurrentes
        </h3>
        <button
          type="button"
          onClick={openAddModal}
          className="px-3 py-1.5 bg-brand-cerulean hover:bg-brand-cerulean/90 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva programación
        </button>
      </div>

      <p className="text-xs text-brand-graphite dark:text-zinc-400 mb-6 leading-relaxed">
        Configura tus pagos fijos (suscripciones, rentas, servicios) o nóminas recurrentes. 
        El sistema registrará de forma automática la transacción en tu historial cuando llegue el día programado.
      </p>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <RefreshCw className="w-6 h-6 text-brand-cerulean animate-spin" />
          <p className="text-xs text-brand-graphite dark:text-zinc-400">Cargando tus programaciones...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl">
          <Clock className="w-8 h-8 text-gray-300 dark:text-zinc-700 mx-auto mb-2" />
          <p className="text-xs font-bold text-gray-500">No tienes programaciones activas.</p>
          <p className="text-[10px] text-gray-400 mt-1">Crea una para automatizar tus cargos o abonos frecuentes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div 
              key={p.id}
              className={`p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                p.is_active 
                  ? 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40' 
                  : 'border-gray-150 dark:border-zinc-850 bg-gray-50/50 dark:bg-zinc-900/10 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg shrink-0 ${
                  p.type === 'income' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400'
                }`}>
                  {p.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-brand-carbon dark:text-white">{p.concept}</span>
                    {p.categories && (
                      <span 
                        className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                        style={{ 
                          backgroundColor: `${p.categories.color || '#3b82f6'}15`, 
                          color: p.categories.color || '#3b82f6' 
                        }}
                      >
                        {p.categories.name}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
                    <span className="flex items-center gap-1">
                      <WalletIcon className="w-3.5 h-3.5 text-gray-300" />
                      {p.wallets?.name || 'Desconocida'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-300" />
                      {getFrequencyLabel(p.frequency)}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-brand-cerulean">
                      <Calendar className="w-3.5 h-3.5" />
                      Próximo: {new Date(p.next_execution_date + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0">
                <span className={`text-xs font-black ${
                  p.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-zinc-300'
                }`}>
                  {p.type === 'income' ? '+' : '-'}${p.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(p)}
                    title={p.is_active ? "Desactivar regla" : "Activar regla"}
                    className={`p-1.5 rounded-lg border transition ${
                      p.is_active 
                        ? 'border-emerald-100 dark:border-emerald-950 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-50' 
                        : 'border-gray-250 dark:border-zinc-800 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(p)}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-850 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-500 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 rounded-lg border border-red-100 dark:border-red-950/40 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
                    <option value="days_14">Catorcenal (Cada 14 días)</option>
                    <option value="days_15">Quincenal (Cada 15 días)</option>
                    <option value="monthly">Mensual</option>
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
