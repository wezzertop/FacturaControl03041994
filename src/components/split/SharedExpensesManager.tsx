"use client";

import React, { useState, useTransition } from "react";
import { 
  Users, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  X, 
  AlertCircle, 
  UserCheck, 
  Divide,
  Scale
} from "lucide-react";
import { 
  SharedExpense, 
  createSharedExpense, 
  settleSharedExpense, 
  deleteSharedExpense 
} from "@/app/actions/split";

interface SharedExpensesManagerProps {
  initialExpenses: SharedExpense[];
  wallets: any[];
}

export default function SharedExpensesManager({
  initialExpenses = [],
  wallets = []
}: SharedExpensesManagerProps) {
  const [expenses, setExpenses] = useState<SharedExpense[]>(initialExpenses);
  const [isPending, startTransition] = useTransition();

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [settlingExpense, setSettlingExpense] = useState<SharedExpense | null>(null);
  const [settleWalletId, setSettleWalletId] = useState<string>(wallets[0]?.id || "");

  // Form states
  const [personName, setPersonName] = useState("");
  const [concept, setConcept] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [splitType, setSplitType] = useState<"they_owe_me" | "i_owe_them">("they_owe_me");
  const [splitRatio, setSplitRatio] = useState<"50_50" | "all_them" | "all_me">("50_50");
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || "");

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Cálculos de Balance
  const theyOweMeTotal = expenses
    .filter(e => !e.is_settled && e.type === "they_owe_me")
    .reduce((sum, e) => sum + Number(e.other_share || 0), 0);

  const iOweThemTotal = expenses
    .filter(e => !e.is_settled && e.type === "i_owe_them")
    .reduce((sum, e) => sum + Number(e.my_share || 0), 0);

  const netBalance = theyOweMeTotal - iOweThemTotal;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim() || !concept.trim() || !totalAmount) return;

    const total = parseFloat(totalAmount);
    if (isNaN(total) || total <= 0) return;

    let myShare = total / 2;
    let otherShare = total / 2;

    if (splitRatio === "all_them") {
      myShare = 0;
      otherShare = total;
    } else if (splitRatio === "all_me") {
      myShare = total;
      otherShare = 0;
    }

    startTransition(async () => {
      const res = await createSharedExpense({
        person_name: personName.trim(),
        concept: concept.trim(),
        total_amount: total,
        my_share: myShare,
        other_share: otherShare,
        type: splitType,
        wallet_id: selectedWalletId || null
      });

      if (res.success && res.expense) {
        setExpenses([res.expense, ...expenses]);
        setIsCreateOpen(false);
        setPersonName("");
        setConcept("");
        setTotalAmount("");
        setMessage({ text: "Gasto compartido registrado con éxito.", type: "success" });
      } else {
        setMessage({ text: res.error || "No se pudo registrar.", type: "error" });
      }
    });
  };

  const handleSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingExpense) return;

    startTransition(async () => {
      const res = await settleSharedExpense(settlingExpense.id, settleWalletId);
      if (res.success) {
        setExpenses(expenses.map(e => e.id === settlingExpense.id ? { ...e, is_settled: true } : e));
        setSettlingExpense(null);
        setMessage({ text: "¡Gasto liquidado y registrado en tu cartera!", type: "success" });
      } else {
        setMessage({ text: res.error || "Error al liquidar.", type: "error" });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar este registro de gasto compartido?")) return;

    startTransition(async () => {
      const res = await deleteSharedExpense(id);
      if (res.success) {
        setExpenses(expenses.filter(e => e.id !== id));
      }
    });
  };

  return (
    <div className="space-y-6">

      {/* KPI Cards de Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0A0A0C] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Te Deben</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              ${theyOweMeTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Por cobrar a amigos o pareja</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0A0A0C] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Tú Debes</p>
            <p className="text-2xl font-black text-rose-400 mt-1">
              ${iOweThemTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Por pagar a otras personas</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0A0A0C] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Balance Neto</p>
            <p className={`text-2xl font-black mt-1 ${netBalance >= 0 ? "text-white" : "text-amber-400"}`}>
              {netBalance >= 0 ? "+" : ""}${netBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5">{netBalance >= 0 ? "Saldo a tu favor" : "Saldo en contra"}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
        </div>
      </div>

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

      {/* Cabecera y Botón Nuevo Gasto Compartido */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] pb-4">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Gastos Compartidos & Cuentas Divididas
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Divide cuentas en pareja o con amigos y salda deudas con 1 solo toque
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-3.5 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-lg active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Dividir Gasto
        </button>
      </div>

      {/* Lista de Gastos Compartidos */}
      {expenses.length === 0 ? (
        <div className="text-center py-16 surface-card rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08] p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white/5 mx-auto flex items-center justify-center text-zinc-500">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">No tienes gastos compartidos registrados</h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Registra cenas, viajes o gastos de casa con amigos y mantén las cuentas claras sin complicaciones.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 bg-white text-black font-extrabold text-xs rounded-xl hover:bg-neutral-200 transition"
          >
            Registrar Primer Gasto 👥
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((item) => {
            const isTheyOweMe = item.type === "they_owe_me";
            const amountToShow = isTheyOweMe ? Number(item.other_share) : Number(item.my_share);

            return (
              <div
                key={item.id}
                className={`surface-card rounded-2xl p-4 border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  item.is_settled
                    ? "opacity-60 bg-slate-50 dark:bg-[#0A0A0C]/50 border-slate-200 dark:border-white/[0.04]"
                    : "bg-white dark:bg-[#0A0A0C] border-slate-200/80 dark:border-white/[0.08] hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                    item.is_settled 
                      ? "bg-white/10 text-zinc-400"
                      : isTheyOweMe 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}>
                    {isTheyOweMe ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                        {item.concept}
                      </h4>
                      {item.is_settled && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-black">
                          Saldado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Con <span className="text-white font-bold">{item.person_name}</span> • Total ticket: ${Number(item.total_amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-white/[0.04]">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] uppercase font-bold text-zinc-400">
                      {isTheyOweMe ? "Te debe" : "Le debes"}
                    </p>
                    <p className={`text-lg font-black ${
                      item.is_settled ? "text-zinc-400" : isTheyOweMe ? "text-emerald-400" : "text-rose-400"
                    }`}>
                      ${amountToShow.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {!item.is_settled && (
                    <button
                      onClick={() => setSettlingExpense(item)}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-extrabold transition active:scale-95 shadow-sm"
                    >
                      Saldar ⚡
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Creación Gasto Compartido */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="surface-card rounded-2xl p-6 max-w-md w-full border border-white/[0.08] shadow-2xl relative animate-slide-up bg-white dark:bg-[#000000] text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-black flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Nuevo Gasto Compartido
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">¿Con quién compartes?</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Sofía, Carlos, Roomies"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Concepto del Gasto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cena en Sonora Grill, Uber, Supermercado"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Monto Total del Ticket (MXN)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ej. 1200.00"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xl font-black text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* ¿Quién Pagó? */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-400 block">¿Quién pagó la cuenta?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSplitType("they_owe_me")}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition ${
                      splitType === "they_owe_me"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-slate-50 dark:bg-[#0A0A0C] text-zinc-400 border-white/[0.06]"
                    }`}
                  >
                    Pagué yo (Me deben)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitType("i_owe_them")}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition ${
                      splitType === "i_owe_them"
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                        : "bg-slate-50 dark:bg-[#0A0A0C] text-zinc-400 border-white/[0.06]"
                    }`}
                  >
                    Pagó la otra persona (Debo)
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending || !personName.trim() || !concept.trim() || !totalAmount}
                className="w-full py-3.5 bg-white hover:bg-neutral-200 text-black font-extrabold text-xs rounded-xl shadow-lg transition disabled:opacity-50 min-h-[44px] mt-2"
              >
                {isPending ? "Registrando..." : "Guardar Gasto Compartido 👥"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Saldar / Liquidar */}
      {settlingExpense && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="surface-card rounded-2xl p-6 max-w-md w-full border border-white/[0.08] shadow-2xl relative animate-slide-up bg-white dark:bg-[#000000] text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-black flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Saldar Gasto Compartido
              </h3>
              <button
                onClick={() => setSettlingExpense(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              ¿Deseas marcar como liquidado el monto de <span className="text-emerald-400 font-bold">${Number(settlingExpense.type === "they_owe_me" ? settlingExpense.other_share : settlingExpense.my_share).toFixed(2)}</span> de <span className="text-white font-bold">{settlingExpense.person_name}</span>?
            </p>

            <form onSubmit={handleSettle} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">
                  {settlingExpense.type === "they_owe_me" ? "Cartera donde recibiste el dinero" : "Cartera de donde pagaste"}
                </label>
                <select
                  value={settleWalletId}
                  onChange={(e) => setSettleWalletId(e.target.value)}
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
                disabled={isPending}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs rounded-xl shadow-lg transition min-h-[44px]"
              >
                {isPending ? "Liquidando..." : "Confirmar y Liquidar Deuda ⚡"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
