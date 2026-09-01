"use client";

import React, { useState, useTransition } from "react";
import { 
  PiggyBank, 
  Plus, 
  Trash2, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Target, 
  Coins, 
  X,
  TrendingUp,
  Landmark
} from "lucide-react";
import { 
  SavingsGoal, 
  createSavingsGoal, 
  depositToSavingsGoal, 
  withdrawFromSavingsGoal, 
  deleteSavingsGoal 
} from "@/app/actions/savings";
import CurrencyInput from "@/components/ui/CurrencyInput";

interface SavingsGoalsManagerProps {
  initialGoals: SavingsGoal[];
  wallets: any[];
}

const GOAL_TEMPLATES = [
  { title: "Fondo de Emergencia", target_amount: 30000, color: "bg-emerald-500", icon: "Shield" },
  { title: "Vacaciones & Viajes", target_amount: 15000, color: "bg-blue-500", icon: "Plane" },
  { title: "Seguro de Auto", target_amount: 8000, color: "bg-amber-500", icon: "Car" },
  { title: "Enganche de Casa", target_amount: 100000, color: "bg-purple-600", icon: "Home" },
  { title: "Inversión / CETES", target_amount: 20000, color: "bg-teal-500", icon: "TrendingUp" }
];

export default function SavingsGoalsManager({ initialGoals, wallets = [] }: SavingsGoalsManagerProps) {
  const [goals, setGoals] = useState<SavingsGoal[]>(initialGoals);
  const [isPending, startTransition] = useTransition();

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeActionModal, setActiveActionModal] = useState<{
    type: "deposit" | "withdraw";
    goal: SavingsGoal;
  } | null>(null);

  // Form states creación
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [initialDeposit, setInitialDeposit] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || "");
  const [selectedColor, setSelectedColor] = useState("bg-emerald-500");

  // Form states depósito / retiro
  const [actionAmount, setActionAmount] = useState("");
  const [actionWalletId, setActionWalletId] = useState(wallets[0]?.id || "");

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const calculateMonthlyTarget = (goal: SavingsGoal) => {
    const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount));
    if (remaining <= 0) return 0;
    if (!goal.target_date) return null;

    const today = new Date();
    const target = new Date(goal.target_date);
    const months = Math.max(1, (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth()));

    return Math.round((remaining / months) * 100) / 100;
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetAmount) return;

    startTransition(async () => {
      const res = await createSavingsGoal({
        title: title.trim(),
        target_amount: parseFloat(targetAmount),
        current_amount: initialDeposit ? parseFloat(initialDeposit) : 0,
        target_date: targetDate || null,
        wallet_id: selectedWalletId || null,
        color: selectedColor,
      });

      if (res.success && res.goal) {
        setGoals([res.goal, ...goals]);
        setIsCreateModalOpen(false);
        setTitle("");
        setTargetAmount("");
        setInitialDeposit("");
        setTargetDate("");
        setMessage({ text: `Meta "${title}" creada exitosamente.`, type: "success" });
      } else {
        setMessage({ text: res.error || "No se pudo crear la meta.", type: "error" });
      }
    });
  };

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeActionModal || !actionAmount) return;

    const numAmount = parseFloat(actionAmount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const { type, goal } = activeActionModal;

    startTransition(async () => {
      let res;
      if (type === "deposit") {
        res = await depositToSavingsGoal(goal.id, actionWalletId, numAmount);
      } else {
        res = await withdrawFromSavingsGoal(goal.id, actionWalletId, numAmount);
      }

      if (res.success) {
        setGoals(goals.map(g => g.id === goal.id ? { ...g, current_amount: Number(res.newAmount || 0) } : g));
        setActiveActionModal(null);
        setActionAmount("");
        setMessage({
          text: type === "deposit" ? `¡Aporte de $${numAmount.toFixed(2)} registrado en "${goal.title}"!` : `¡Retiro de $${numAmount.toFixed(2)} aplicado!`,
          type: "success"
        });
      } else {
        setMessage({ text: res.error || "Error al procesar la operación.", type: "error" });
      }
    });
  };

  const handleDeleteGoal = (goalId: string, goalTitle: string) => {
    if (!confirm(`¿Estás seguro de eliminar la meta "${goalTitle}"?`)) return;

    startTransition(async () => {
      const res = await deleteSavingsGoal(goalId);
      if (res.success) {
        setGoals(goals.filter(g => g.id !== goalId));
        setMessage({ text: `Meta "${goalTitle}" eliminada.`, type: "success" });
      } else {
        setMessage({ text: res.error || "Error al eliminar meta.", type: "error" });
      }
    });
  };

  const totalSaved = goals.reduce((sum, g) => sum + Number(g.current_amount || 0), 0);
  const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount || 0), 0);
  const globalProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  return (
    <div className="space-y-6">
      
      {/* Tarjetas KPI Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between bg-white dark:bg-[#0A0A0C]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Ahorrado</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              ${totalSaved.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5">En {goals.length} apartados activos</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <PiggyBank className="w-5 h-5" />
          </div>
        </div>

        <div className="surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between bg-white dark:bg-[#0A0A0C]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Monto Objetivo Total</p>
            <p className="text-2xl font-black text-white mt-1">
              ${totalTarget.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Progreso global del {globalProgress}%</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
        </div>

        <div className="surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between bg-white dark:bg-[#0A0A0C]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Metas Cumplidas</p>
            <p className="text-2xl font-black text-amber-400 mt-1">
              {goals.filter(g => Number(g.current_amount) >= Number(g.target_amount)).length} / {goals.length}
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Objetivos completados al 100%</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Alertas */}
      {message && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in ${
          message.type === "success" 
            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" 
            : "bg-rose-500/15 border-rose-500/30 text-rose-300"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <p className="text-sm font-bold">{message.text}</p>
        </div>
      )}

      {/* Cabecera y Botón Nueva Meta */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] pb-4">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-emerald-400" />
            Mis Apartados y Metas de Ahorro
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Separa fondos de tus cuentas y calcula tu ahorro mensual automático
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3.5 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-lg active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nueva Meta
        </button>
      </div>

      {/* Grid de Metas de Ahorro */}
      {goals.length === 0 ? (
        <div className="text-center py-16 surface-card rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08] p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white/5 mx-auto flex items-center justify-center text-zinc-500">
            <PiggyBank className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">No tienes apartados creados aún</h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Crea tu primera meta como tu Fondo de Emergencia o Vacaciones para empezar a separar tu dinero.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-white text-black font-extrabold text-xs rounded-xl hover:bg-neutral-200 transition"
          >
            Crear Mi Primera Meta ⚡
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const current = Number(goal.current_amount || 0);
            const target = Number(goal.target_amount || 0);
            const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
            const isCompleted = current >= target;
            const monthlySuggestion = calculateMonthlyTarget(goal);

            return (
              <div
                key={goal.id}
                className="surface-card rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-5 bg-white dark:bg-[#0A0A0C] space-y-4 hover:border-white/20 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${goal.color || "bg-emerald-500"} text-white flex items-center justify-center shadow-md font-bold`}>
                        <PiggyBank className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                          {goal.title}
                        </h4>
                        {goal.wallets?.name && (
                          <span className="text-[10px] text-zinc-400 font-medium">
                            Vinculada a {goal.wallets.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteGoal(goal.id, goal.title)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Eliminar meta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Montos y Progreso */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-black text-white">
                        ${current.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs font-bold text-zinc-400">
                        de ${target.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Barra de progreso */}
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#141418] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isCompleted ? "bg-amber-400" : "bg-emerald-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400">
                      <span>{pct}% completado</span>
                      <span>Restan ${(Math.max(0, target - current)).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Aporte Mensual Sugerido */}
                  {monthlySuggestion !== null && monthlySuggestion > 0 && !isCompleted && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#141418] border border-slate-200 dark:border-white/[0.04] flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-400" /> Aporte mensual sugerido:
                      </span>
                      <span className="text-xs font-black text-emerald-400">
                        ${monthlySuggestion.toLocaleString("es-MX", { minimumFractionDigits: 2 })}/mes
                      </span>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="mt-3 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black text-center flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> ¡Meta Completada!
                    </div>
                  )}
                </div>

                {/* Botones de Acción Rápida: Aportar / Retirar */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.04]">
                  <button
                    onClick={() => setActiveActionModal({ type: "deposit", goal })}
                    className="py-2 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1 border border-emerald-500/20 transition active:scale-95"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Aportar
                  </button>

                  <button
                    onClick={() => setActiveActionModal({ type: "withdraw", goal })}
                    className="py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1 border border-white/10 transition active:scale-95"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    Retirar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Creación */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="surface-card rounded-2xl p-6 max-w-md w-full border border-white/[0.08] shadow-2xl relative animate-slide-up bg-white dark:bg-[#000000] text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-black flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-emerald-400" />
                Nueva Meta de Ahorro
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Plantillas Rápidas */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-zinc-400">Plantillas Rápidas:</label>
              <div className="flex flex-wrap gap-1.5">
                {GOAL_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.title}
                    type="button"
                    onClick={() => {
                      setTitle(tpl.title);
                      setTargetAmount(tpl.target_amount.toString());
                      setSelectedColor(tpl.color);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#141418] text-[11px] font-bold text-zinc-300 hover:text-white hover:border-white/20 border border-transparent transition"
                  >
                    {tpl.title}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Nombre de la Meta</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Fondo de Emergencia, Vacaciones"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-white/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">Monto Objetivo (MXN)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ej. 25000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-white/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">Fecha Límite (Opcional)</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Cartera de Origen Asignada</label>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-white focus:outline-none"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id} className="bg-neutral-900 text-white">
                      {w.name} (Saldo: ${Number(w.balance || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isPending || !title.trim() || !targetAmount}
                className="w-full py-3.5 bg-white hover:bg-neutral-200 text-black font-extrabold text-xs rounded-xl shadow-lg transition disabled:opacity-50 min-h-[44px] mt-2"
              >
                {isPending ? "Creando meta..." : "Crear Meta de Ahorro 🚀"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Aportar / Retirar Dinero */}
      {activeActionModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="surface-card rounded-2xl p-6 max-w-md w-full border border-white/[0.08] shadow-2xl relative animate-slide-up bg-white dark:bg-[#000000] text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-black flex items-center gap-2">
                {activeActionModal.type === "deposit" ? (
                  <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ArrowDownLeft className="w-5 h-5 text-amber-400" />
                )}
                {activeActionModal.type === "deposit" ? "Aportar a Meta" : "Retirar de Meta"}
              </h3>
              <button
                onClick={() => setActiveActionModal(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Meta: <span className="text-white font-bold">{activeActionModal.goal.title}</span> (Saldo actual: ${Number(activeActionModal.goal.current_amount || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })})
            </p>

            <form onSubmit={handleAction} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">
                  {activeActionModal.type === "deposit" ? "Monto a Aportar (MXN)" : "Monto a Retirar (MXN)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ej. 1000.00"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xl font-black text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">
                  {activeActionModal.type === "deposit" ? "Retirar de Cartera (Origen)" : "Depositar en Cartera (Destino)"}
                </label>
                <select
                  value={actionWalletId}
                  onChange={(e) => setActionWalletId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-white focus:outline-none"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id} className="bg-neutral-900 text-white">
                      {w.name} (Saldo: ${Number(w.balance || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isPending || !actionAmount}
                className="w-full py-3.5 bg-white hover:bg-neutral-200 text-black font-extrabold text-xs rounded-xl shadow-lg transition disabled:opacity-50 min-h-[44px] mt-2"
              >
                {isPending ? "Procesando..." : activeActionModal.type === "deposit" ? "Confirmar Aporte ⚡" : "Confirmar Retiro 💸"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
