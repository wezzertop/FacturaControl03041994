"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw, CheckCircle2, CloudSync, Sparkles } from "lucide-react";
import { createTransaction } from "@/app/actions/wallets";

const OFFLINE_QUEUE_KEY = "facturacontrol_offline_tx_queue";

export interface OfflineTransaction {
  id: string;
  wallet_id: string;
  type: "income" | "expense";
  amount: number;
  concept: string;
  category_id?: string | null;
  date?: string;
  timestamp: number;
}

export function saveOfflineTransaction(tx: Omit<OfflineTransaction, "id" | "timestamp">) {
  if (typeof window === "undefined") return;
  try {
    const queue: OfflineTransaction[] = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
    const newTx: OfflineTransaction = {
      ...tx,
      id: `offline-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now()
    };
    queue.push(newTx);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new Event("offline_queue_updated"));
  } catch (err) {
    console.error("Error al guardar transacción offline:", err);
  }
}

export function getOfflineQueue(): OfflineTransaction[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function OfflineSyncManager() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const updateQueueCount = () => {
    const queue = getOfflineQueue();
    setPendingCount(queue.length);
  };

  const syncQueue = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    let syncedCount = 0;
    const remaining: OfflineTransaction[] = [];

    for (const tx of queue) {
      try {
        const res = await createTransaction({
          wallet_id: tx.wallet_id,
          type: tx.type,
          amount: tx.amount,
          concept: `${tx.concept} (Sync Offline)`,
          category_id: tx.category_id || null,
          date: tx.date || new Date().toISOString()
        });

        if (res.success) {
          syncedCount++;
        } else {
          remaining.push(tx);
        }
      } catch (err) {
        console.error("Error al sincronizar tx:", err);
        remaining.push(tx);
      }
    }

    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    setPendingCount(remaining.length);
    setIsSyncing(false);

    if (syncedCount > 0) {
      setSyncSuccessMsg(`¡${syncedCount} movimiento${syncedCount > 1 ? "s" : ""} sincronizado${syncedCount > 1 ? "s" : ""} exitosamente!`);
      setTimeout(() => {
        setSyncSuccessMsg(null);
        window.location.reload();
      }, 2000);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    updateQueueCount();

    const handleOnline = () => {
      setIsOnline(true);
      syncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueUpdated = () => {
      updateQueueCount();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("offline_queue_updated", handleQueueUpdated);

    // Intentar sincronizar al montar si hay conexión y cola pendiente
    if (navigator.onLine) {
      syncQueue();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("offline_queue_updated", handleQueueUpdated);
    };
  }, []);

  if (isOnline && pendingCount === 0 && !syncSuccessMsg) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] max-w-sm w-[90%] sm:w-auto animate-in slide-in-from-top-4">
      {!isOnline && (
        <div className="px-3.5 py-2 rounded-2xl bg-amber-500 text-black font-black text-xs shadow-xl flex items-center justify-between gap-2.5 border border-amber-400">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>Modo Offline: Puedes seguir registrando</span>
          </div>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-black/20 text-black text-[10px] font-black">
              {pendingCount} pendiente{pendingCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {isOnline && isSyncing && (
        <div className="px-4 py-2 rounded-2xl bg-white dark:bg-[#141418] text-white font-bold text-xs shadow-2xl flex items-center gap-2.5 border border-white/10">
          <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>Sincronizando {pendingCount} movimientos con la nube...</span>
        </div>
      )}

      {syncSuccessMsg && (
        <div className="px-4 py-2 rounded-2xl bg-emerald-500 text-black font-black text-xs shadow-2xl flex items-center gap-2.5 border border-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}
    </div>
  );
}
