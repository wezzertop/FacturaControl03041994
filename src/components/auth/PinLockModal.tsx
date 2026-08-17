"use client";

import React, { useState, useEffect } from "react";
import { Lock, Unlock, ShieldCheck, KeyRound, Sparkles, X } from "lucide-react";

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
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="surface-card rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-slate-700/80 shadow-2xl text-center relative animate-slide-up">
        {/* Encabezado */}
        <div className="w-14 h-14 bg-brand-cerulean/15 text-brand-cerulean rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-cerulean/30 shadow-inner">
          {isSettingUp ? <KeyRound className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
        </div>

        <h3 className="text-xl font-black text-white tracking-tight">
          {isSettingUp ? "Crea tu PIN de Seguridad" : "FacturaControl Bloqueado"}
        </h3>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-medium">
          {isSettingUp
            ? "Configura un PIN de 4 a 6 dígitos para proteger tus datos financieros en tu Dokploy/servidor."
            : "Ingresa tu PIN de seguridad para acceder a tus carteras y facturas."}
        </p>

        {/* Círculos de progreso del PIN */}
        <div className="flex justify-center gap-3 my-6">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                idx < pin.length
                  ? "bg-brand-cerulean scale-110 shadow-sm shadow-brand-cerulean/50"
                  : "bg-slate-800 border border-slate-700"
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <p className="text-xs font-bold text-rose-500 mb-4 animate-shake">{errorMsg}</p>
        )}

        {/* Teclado numérico táctil (Ideal Móvil y Escritorio) */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="py-3.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800/90 active:scale-95 text-white font-black text-lg rounded-2xl transition-all shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="py-3.5 bg-slate-900/50 hover:bg-slate-800 text-slate-400 font-bold text-xs rounded-2xl transition-all"
          >
            Borrar
          </button>
          <button
            onClick={() => handleKeyPress("0")}
            className="py-3.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800/90 active:scale-95 text-white font-black text-lg rounded-2xl transition-all shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="py-3.5 bg-slate-900/50 hover:bg-slate-800 text-slate-400 font-bold text-xs rounded-2xl transition-all"
          >
            ⌫
          </button>
        </div>

        {/* Botón de Confirmación */}
        <button
          onClick={handleSubmit}
          disabled={pin.length < 4}
          className="w-full py-3.5 bg-brand-cerulean hover:bg-brand-cerulean/90 disabled:opacity-40 text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-brand-cerulean/20 flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4" />
          {isSettingUp ? "Guardar PIN de Seguridad" : "Desbloquear FacturaControl"}
        </button>
      </div>
    </div>
  );
}
