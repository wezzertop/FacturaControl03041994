"use client";

import React, { useState, useEffect } from "react";
import { Lock, Unlock, ShieldCheck, KeyRound, Sparkles, X, Delete } from "lucide-react";

interface PinLockModalProps {
  onUnlockSuccess?: () => void;
}

export default function PinLockModal({ onUnlockSuccess }: PinLockModalProps) {
  const [pin, setPin] = useState<string>("");
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [isSettingUp, setIsSettingUp] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si ya existe un PIN guardado localmente en localStorage/cookie
    const savedPin = localStorage.getItem("fc_security_pin");
    const sessionAuth = sessionStorage.getItem("fc_pin_unlocked");

    if (!savedPin) {
      setIsSettingUp(true);
      setIsLocked(true);
    } else {
      setStoredPin(savedPin);
      if (sessionAuth === "true") {
        setIsLocked(false);
      } else {
        setIsLocked(true);
      }
    }
  }, []);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 6) {
      setErrorMsg(null);
      setPin((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    setErrorMsg(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setErrorMsg(null);
    setPin("");
  };

  const handleSubmit = () => {
    if (pin.length < 4) {
      setErrorMsg("El PIN debe tener al menos 4 dígitos");
      return;
    }

    if (isSettingUp) {
      // Guardar el nuevo PIN de seguridad
      localStorage.setItem("fc_security_pin", pin);
      sessionStorage.setItem("fc_pin_unlocked", "true");
      setStoredPin(pin);
      setIsSettingUp(false);
      setIsLocked(false);
      if (onUnlockSuccess) onUnlockSuccess();
    } else {
      // Verificar PIN ingresado contra el guardado
      if (pin === storedPin) {
        sessionStorage.setItem("fc_pin_unlocked", "true");
        setIsLocked(false);
        setPin("");
        if (onUnlockSuccess) onUnlockSuccess();
      } else {
        setErrorMsg("PIN incorrecto. Intenta de nuevo.");
        setPin("");
      }
    }
  };

  // Autoejecutar submit al llegar a 4 o 6 dígitos si coincide
  useEffect(() => {
    if (!isSettingUp && storedPin && pin.length >= 4 && pin === storedPin) {
      sessionStorage.setItem("fc_pin_unlocked", "true");
      setIsLocked(false);
      setPin("");
      if (onUnlockSuccess) onUnlockSuccess();
    }
  }, [pin, storedPin, isSettingUp, onUnlockSuccess]);

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="surface-card rounded-2xl p-6 sm:p-7 max-w-sm w-full border border-slate-200 dark:border-white/[0.08] shadow-2xl text-center relative animate-slide-up bg-white dark:bg-[#000000]">
        {/* Encabezado */}
        <div className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center mx-auto mb-3.5 border border-white/20">
          {isSettingUp ? <KeyRound className="w-6 h-6 text-amber-400" /> : <Lock className="w-6 h-6 text-white" />}
        </div>

        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
          {isSettingUp ? "Crea tu PIN de Seguridad" : "FacturaControl Bloqueado"}
        </h3>
        <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed font-medium">
          {isSettingUp
            ? "Configura un PIN de 4 a 6 dígitos para proteger tus datos financieros."
            : "Ingresa tu PIN de seguridad para acceder a tus carteras y facturas."}
        </p>

        {/* Círculos de progreso del PIN */}
        <div className="flex justify-center gap-3 my-5">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                idx < pin.length
                  ? "bg-white scale-110 shadow-sm"
                  : "bg-slate-200 dark:bg-[#141418] border border-slate-300 dark:border-white/[0.08]"
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-3 animate-shake">{errorMsg}</p>
        )}

        {/* Teclado numérico táctil */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="py-3 bg-slate-100 dark:bg-[#141418] hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/[0.06] active:scale-95 text-slate-900 dark:text-white font-black text-base rounded-xl transition-all shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="py-3 bg-slate-100/60 dark:bg-[#141418]/60 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-zinc-400 font-bold text-xs rounded-xl transition-all"
          >
            Borrar
          </button>
          <button
            onClick={() => handleKeyPress("0")}
            className="py-3 bg-slate-100 dark:bg-[#141418] hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/[0.06] active:scale-95 text-slate-900 dark:text-white font-black text-base rounded-xl transition-all shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="py-3 bg-slate-100/60 dark:bg-[#141418]/60 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-zinc-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Botón de Confirmación */}
        <button
          onClick={handleSubmit}
          disabled={pin.length < 4}
          className="w-full py-3.5 bg-white text-black font-extrabold text-xs rounded-xl hover:bg-neutral-200 disabled:opacity-40 transition shadow-lg flex items-center justify-center gap-2 min-h-[44px]"
        >
          {isSettingUp ? "Guardar y Activar PIN" : "Desbloquear FacturaControl"}
        </button>
      </div>
    </div>
  );
}
