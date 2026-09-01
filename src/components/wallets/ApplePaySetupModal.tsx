"use client";

import React, { useState } from "react";
import { 
  Smartphone, 
  Zap, 
  Check, 
  Copy, 
  ExternalLink, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  CreditCard,
  Sparkles,
  Info
} from "lucide-react";

interface ApplePaySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ApplePaySetupModal({
  isOpen,
  onClose,
  onSuccess
}: ApplePaySetupModalProps) {
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "https://tudominio.com";
  const webhookUrl = `${currentOrigin}/api/wallet/apple-pay?amount=120.00&merchant=Starbucks&card=ApplePay`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRunTestPayment = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      if (navigator.vibrate) navigator.vibrate([30, 50, 30]);

      const testAmounts = [120.00, 45.50, 230.00, 89.00];
      const testMerchants = ["Starbucks Coffee", "OXXO Express", "Uber Trip", "Amazon México", "Mercado Libre"];
      const randomAmount = testAmounts[Math.floor(Math.random() * testAmounts.length)];
      const randomMerchant = testMerchants[Math.floor(Math.random() * testMerchants.length)];

      const res = await fetch("/api/wallet/apple-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: randomAmount,
          merchant: randomMerchant,
          card: "Apple Pay (Prueba)",
          type: "expense"
        })
      });

      const data = await res.json();
      if (data.success) {
        setTestResult(`¡Éxito! Transacción de $${randomAmount.toFixed(2)} en ${randomMerchant} registrada al instante en tu cartera.`);
        if (onSuccess) onSuccess();
      } else {
        setTestResult(`Error: ${data.error || "No se pudo completar la simulación"}`);
      }
    } catch (e: any) {
      setTestResult(`Error de conexión: ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="surface-card rounded-2xl p-6 max-w-lg w-full border border-white/[0.08] shadow-2xl relative animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar bg-white dark:bg-[#000000] text-slate-900 dark:text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-white text-black flex items-center justify-center shadow-lg font-black text-xs">
             Pay
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight">
              Detección Automática Apple Pay
            </h3>
            <p className="text-xs text-zinc-400">
              Registra cada compra al instante en cuanto tocas tu iPhone
            </p>
          </div>
        </div>

        {testResult && (
          <div className={`p-3.5 mb-4 text-xs font-bold rounded-xl border flex items-center gap-2.5 ${
            testResult.startsWith("¡Éxito")
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}>
            <Sparkles className="w-4 h-4 shrink-0" />
            <div className="flex-1">{testResult}</div>
          </div>
        )}

        {/* Botón de Prueba Rápida 1-Clic */}
        <div className="mb-5 p-4 rounded-2xl bg-[#0A0A0C] border border-white/[0.08] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400 fill-current" />
              Simulador de Pago Instantáneo
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-md border border-emerald-500/30">
              En Vivo
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Prueba cómo la app detecta y registra el pago con Apple Pay en milisegundos sin fricción.
          </p>
          <button
            onClick={handleRunTestPayment}
            disabled={testing}
            className="w-full py-2.5 bg-white hover:bg-neutral-200 text-black font-extrabold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 min-h-[40px] disabled:opacity-50"
          >
            {testing ? "Simulando pago Apple Pay..." : "⚡ Simular Pago Apple Pay ($120.00)"}
          </button>
        </div>

        {/* Pasos de Configuración en iPhone */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            Cómo activarlo en 3 pasos en tu iPhone:
          </h4>

          {/* Paso 1 */}
          <div className="p-3.5 rounded-xl bg-[#0A0A0C] border border-white/[0.08] space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[11px]">1</span>
              Abre la app "Atajos" (Shortcuts) en iPhone
            </div>
            <p className="text-[11px] text-zinc-400 pl-7">
              Ve a la pestaña inferior <b>"Automatización"</b> y toca el botón <b>"+"</b> (Crear automatización personal).
            </p>
          </div>

          {/* Paso 2 */}
          <div className="p-3.5 rounded-xl bg-[#0A0A0C] border border-white/[0.08] space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[11px]">2</span>
              Elige el activador "Transacción" (Apple Pay)
            </div>
            <p className="text-[11px] text-zinc-400 pl-7">
              Selecciona <b>Cualquier tarjeta</b> y elige <b>"Ejecutar inmediatamente"</b> (sin preguntar).
            </p>
          </div>

          {/* Paso 3 */}
          <div className="p-3.5 rounded-xl bg-[#0A0A0C] border border-white/[0.08] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[11px]">3</span>
              Agrega la acción "Obtener contenido de URL"
            </div>
            <p className="text-[11px] text-zinc-400 pl-7">
              Pega la URL de webhook de tu FacturaControl:
            </p>
            <div className="pl-7">
              <div className="flex items-center justify-between bg-[#141418] p-2 rounded-lg border border-white/[0.06] gap-2">
                <code className="text-[10px] text-zinc-300 font-mono truncate">{webhookUrl}</code>
                <button
                  onClick={handleCopyWebhook}
                  className="p-1 text-zinc-400 hover:text-white transition shrink-0"
                  title="Copiar URL"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-white/[0.08] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs transition"
          >
            Listo, entendido
          </button>
        </div>
      </div>
    </div>
  );
}
