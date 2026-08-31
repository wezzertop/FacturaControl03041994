"use client";

import React, { useState, useEffect } from "react";
import { Download, Share, PlusSquare, X, Smartphone, MoreVertical, Check } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Detectar si ya está corriendo como app nativa / PWA standalone
    const isStandaloneMode = 
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://");

    if (isStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // 2. Verificar si el usuario ya descartó el aviso recientemente
    const dismissed = localStorage.getItem("fc_pwa_prompt_dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      return; // No molestar por 7 días
    }

    // 3. Detectar dispositivo iOS o Android
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);

    setIsIos(isIosDevice);
    setIsAndroid(isAndroidDevice);

    // 4. Capturar evento de instalación de Android / Chrome
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsOpen(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Mostrar banner tras 2.5 segundos tanto en iOS como en Android
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setIsOpen(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem("fc_pwa_prompt_dismissed", Date.now().toString());
  };

  if (isStandalone || !isOpen) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 md:hidden animate-slide-up">
      <div className="surface-card rounded-2xl p-4 border border-brand-cerulean/40 shadow-2xl bg-[#0F1626] text-white backdrop-blur-xl relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          aria-label="Cerrar aviso"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="w-10 h-10 rounded-xl bg-brand-cerulean text-white flex items-center justify-center shrink-0 shadow-md">
            <Smartphone className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
              Instalar FacturaControl
              <span className="text-[10px] font-bold bg-brand-cerulean/25 text-sky-300 px-2 py-0.5 rounded-md border border-brand-cerulean/35">
                App Móvil
              </span>
            </h4>

            {isIos ? (
              <div className="text-[11px] text-slate-300 mt-1.5 leading-relaxed space-y-1">
                <p>Instala la app en tu iPhone sin tiendas:</p>
                <div className="flex items-center gap-1.5 font-semibold text-sky-400">
                  1. Toca <Share className="w-3.5 h-3.5 inline" /> <b>Compartir</b> en Safari
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-sky-400">
                  2. Elige <PlusSquare className="w-3.5 h-3.5 inline" /> <b>"Agregar a Inicio"</b>
                </div>
              </div>
            ) : isAndroid ? (
              <div className="text-[11px] text-slate-300 mt-1.5 leading-relaxed space-y-1.5">
                <p>Instala la app en tu Android:</p>
                {deferredPrompt ? (
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-2 bg-brand-cerulean hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5 mt-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Instalar en 1 Clic 📲
                  </button>
                ) : (
                  <div className="space-y-1 text-slate-300">
                    <div className="flex items-center gap-1.5 font-semibold text-sky-400">
                      1. Toca los 3 puntos <MoreVertical className="w-3.5 h-3.5 inline" /> en Chrome
                    </div>
                    <div className="flex items-center gap-1.5 font-semibold text-sky-400">
                      2. Elige <Download className="w-3.5 h-3.5 inline" /> <b>"Instalar aplicación"</b> o <b>"Agregar a pantalla principal"</b>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Instala la aplicación en tu pantalla de inicio para acceder en 1 toque a pantalla completa.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
