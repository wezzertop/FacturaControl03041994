"use client";

import React from "react";
import { Sparkles, ShieldCheck, Heart, Bot, Zap, Smile } from "lucide-react";

export type MascotMood = "welcoming" | "income" | "wallets" | "loans" | "categories" | "success";

interface RoboticMascotProps {
  mood?: MascotMood;
  customMessage?: string;
}

const MOOD_CONFIG: Record<MascotMood, { title: string; text: string; badge: string }> = {
  welcoming: {
    title: "¡Hola! Soy Lukas",
    text: "Tu copiloto financiero inteligente. Vamos a poner en orden tus finanzas en menos de 1 minuto. Cero trámites y 100% privado.",
    badge: "Asistente Financiero"
  },
  income: {
    title: "Tus Ingresos y Nómina",
    text: "Registrar tus ingresos recurrentes me permite calcular cuánto dinero tendrás libre cada quincena antes de gastar.",
    badge: "Flujo de Efectivo"
  },
  wallets: {
    title: "Tus Carteras y Tarjetas",
    text: "Configura tus cuentas principales (Efectivo, Débito o Crédito). Así sabrás tu saldo neto consolidado en tiempo real.",
    badge: "Cuentas Claras"
  },
  loans: {
    title: "Préstamos y Financiamiento",
    text: "¿Tienes algún crédito activo? Te ayudaré a simular la liquidación más rápida para que ahorres miles de pesos en intereses.",
    badge: "Control de Deudas"
  },
  categories: {
    title: "Categorías Inteligentes",
    text: "Clasificaré automáticamente tus compras en súper, comida, gasolina y servicios para que nunca haya gastos no identificados.",
    badge: "Organización Total"
  },
  success: {
    title: "Todo Listo para Iniciar",
    text: "Revisa tu resumen. En cuanto confirmes, tendrás una plataforma financiera de nivel profesional diseñada para ti.",
    badge: "Configuración Completa"
  }
};

export default function RoboticMascot({ mood = "welcoming", customMessage }: RoboticMascotProps) {
  const currentMood = MOOD_CONFIG[mood] || MOOD_CONFIG.welcoming;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-cerulean/15 via-slate-900/40 to-purple-500/10 border border-brand-cerulean/30 p-4 sm:p-5 shadow-lg animate-in fade-in duration-300">
      
      {/* Resplandor de fondo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cerulean/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/15 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        
        {/* Avatar Robótico Interactivo con Animación SVG */}
        <div className="relative shrink-0 flex items-center justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#0A0A0C] border-2 border-brand-cerulean/50 p-2 shadow-xl flex items-center justify-center relative group">
            
            {/* Antena Robótica con Luz de Pulso */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
              <div className="w-0.5 h-2 bg-brand-cerulean/60" />
            </div>

            {/* Ilustración de Cara del Robot */}
            <div className="w-full h-full rounded-xl bg-gradient-to-b from-[#141824] to-[#0D101A] flex flex-col items-center justify-center p-1 relative overflow-hidden">
              
              {/* Ojos LED Circulares Azules */}
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/80 animate-pulse flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-white" />
                </div>
                <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/80 animate-pulse flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-white" />
                </div>
              </div>

              {/* Boca / Visor Digital */}
              <div className="w-7 h-1.5 rounded-full bg-emerald-400/80 shadow-sm flex items-center justify-center">
                <div className="w-4 h-0.5 bg-white/80 rounded-full" />
              </div>

              {/* Auriculares / Orejas del Robot */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3 rounded-r bg-brand-cerulean/80" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-3 rounded-l bg-brand-cerulean/80" />
            </div>

            {/* Badge de Seguridad */}
            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-md ring-2 ring-[#0A0A0C]">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Globo de Diálogo de Confianza */}
        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            <span className="text-xs font-black text-white">
              {currentMood.title}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-brand-cerulean/20 text-brand-cerulean text-[10px] font-black border border-brand-cerulean/30">
              {currentMood.badge}
            </span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed max-w-xl">
            {customMessage || currentMood.text}
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-3 pt-1 text-[10px] text-zinc-400 font-bold">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3 h-3" /> Privacidad Garantizada
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-cyan-400">
              <Zap className="w-3 h-3" /> Sincronización Automática
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
