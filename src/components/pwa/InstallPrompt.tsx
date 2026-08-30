"use client";

import React, { useState, useEffect } from "react";
import { Download, Share, PlusSquare, X, Smartphone, Check } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
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

    // 3. Detectar dispositivo iOS (iPhone / iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 4. Capturar evento de instalación de Android / Chrome
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsOpen(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // En iOS mostrar banner tras 3 segundos de navegación
    if (isIosDevice) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
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
      <div className="surface-card rounded-3xl p-4 border border-brand-cerulean/30 shadow-2xl bg-slate-900/95 text-white backdrop-blur-xl relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
          aria-label="Cerrar aviso"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-cerulean to-blue-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <Smartphone className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
              Instalar FacturaControl
              <span className="text-[10px] font-bold bg-brand-cerulean/20 text-brand-cerulean px-2 py-0.5 rounded-full border border-brand-cerulean/30">
                App Móvil
              </span>
            </h4>

            {isIos ? (
              <div className="text-[11px] text-slate-300 mt-1 leading-relaxed space-y-1">
                <p>Usa la app a pantalla completa en tu iPhone:</p>
                <div className="flex items-center gap-1 font-semibold text-brand-cerulean">
                  1. Toca <Share className="w-3.5 h-3.5 inline" /> Compartir en Safari
                </div>
                <div className="flex items-center gap-1 font-semibold text-brand-cerulean">
                  2. Elige <PlusSquare className="w-3.5 h-3.5 inline" /> "Agregar a Inicio"
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Instala la aplicación en tu Android para acceder en 1 toque a pantalla completa.
              </p>
            )}

            {!isIos && deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="mt-3 w-full py-2 bg-gradient-to-r from-brand-cerulean to-blue-600 hover:from-blue-600 hover:to-brand-cerulean text-white font-extrabold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Instalar Ahora (1 Clic)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
