"use client";

import React, { useState, useEffect } from "react";
import { Bell, CheckCheck, Trash2, X, AlertCircle, Calendar, Sparkles, Smartphone } from "lucide-react";
import {
  AppNotification,
  getStoredNotifications,
  markAllNotificationsAsRead,
  clearAllNotifications,
  getNotificationPermission,
  requestNotificationPermission,
  saveNotification,
} from "@/lib/notifications";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<string>("default");

  const refreshList = () => {
    setNotifications(getStoredNotifications());
    setPermission(getNotificationPermission());
  };

  useEffect(() => {
    refreshList();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpen = () => {
    setIsOpen(true);
    refreshList();
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
    refreshList();
  };

  const handleClear = () => {
    clearAllNotifications();
    refreshList();
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted ? "granted" : "denied");
    if (granted) {
      saveNotification({
        title: "🔔 Notificaciones Activadas",
        body: "Recibirás alertas de próximas fechas de pago y recordatorios de gastos.",
        type: "system",
      });
      refreshList();
    }
  };

  return (
    <>
      {/* Botón de Campana */}
      <button
        onClick={handleOpen}
        className="relative p-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-zinc-700 transition active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Abrir notificaciones"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-cerulean text-[10px] font-black text-white shadow-md animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Drawer / Modal de Notificaciones */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex justify-end">
          <div 
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 h-full shadow-2xl border-l border-slate-200 dark:border-zinc-800 flex flex-col z-10 animate-slide-left safe-top safe-bottom">
            {/* Header del Panel */}
            <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-cerulean/10 text-brand-cerulean">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Notificaciones
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {unreadCount} sin leer
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Banner de Permiso de Notificaciones Nativas */}
            {permission !== "granted" && (
              <div className="m-4 p-4 rounded-2xl bg-brand-cerulean/10 border border-brand-cerulean/30 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-brand-cerulean text-xs font-bold">
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>Activa las notificaciones en tu celular</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                  Recibe recordatorios cuando tus tarjetas o préstamos estén próximos a vencer.
                </p>
                <button
                  onClick={handleRequestPermission}
                  className="w-full py-2 bg-brand-cerulean hover:opacity-90 text-white font-extrabold text-xs rounded-xl transition shadow-sm"
                >
                  Permitir Notificaciones
                </button>
              </div>
            )}

            {/* Acciones Rápidas del Panel */}
            {notifications.length > 0 && (
              <div className="px-5 py-2.5 bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                <button
                  onClick={handleMarkAllRead}
                  className="font-bold text-brand-cerulean hover:underline flex items-center gap-1.5"
                >
                  <CheckCheck className="w-4 h-4" /> Marcar como leídas
                </button>
                <button
                  onClick={handleClear}
                  className="font-bold text-rose-500 hover:underline flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Limpiar todo
                </button>
              </div>
            )}

            {/* Lista de Notificaciones */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <Bell className="w-10 h-10 mb-3 stroke-1 text-slate-300 dark:text-zinc-700" />
                  <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                    No tienes notificaciones pendientes
                  </p>
                  <p className="text-xs mt-1 text-slate-500 dark:text-zinc-500">
                    Las alertas de tus compras y cortes de tarjeta aparecerán aquí.
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      n.read
                        ? "bg-slate-50/70 dark:bg-zinc-900/40 border-slate-200/60 dark:border-zinc-800/50 opacity-80"
                        : "bg-white dark:bg-zinc-900 border-brand-cerulean/40 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-brand-cerulean shrink-0" />
                        )}
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(n.date).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
                      {n.body}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
