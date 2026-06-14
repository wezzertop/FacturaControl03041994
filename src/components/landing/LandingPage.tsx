'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Zap, 
  UploadCloud, 
  ShieldCheck, 
  Wallet, 
  TrendingUp, 
  FileText, 
  Camera, 
  CheckCircle, 
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  HelpCircle,
  PiggyBank,
  Check
} from 'lucide-react';

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "¿Es seguro usar mis facturas XML en FacturaControl?",
      a: "Totalmente seguro. Las facturas XML (CFDI) no contienen información bancaria confidencial ni permiten realizar movimientos en tu nombre ante el SAT. Solo contienen datos de facturación (emisor, receptor, conceptos e impuestos) que procesamos de forma estrictamente privada para organizar tus finanzas personales."
    },
    {
      q: "¿Cómo funciona la clasificación automática por RFC?",
      a: "Cuando configuras tu RFC en el sistema, cada vez que subes una factura, comparamos tu RFC con el del emisor. Si coincide, sabemos que es un ingreso (como tu nómina o un cobro). Si no coincide, se clasifica al instante como un egreso o gasto, asignándole una categoría de consumo recomendada."
    },
    {
      q: "¿Qué es el escáner OCR de transferencias?",
      a: "Es una herramienta de inteligencia artificial en tu navegador que te permite subir una captura de pantalla de una transferencia realizada (como en la app de BBVA). El sistema lee la imagen, extrae el monto, el concepto y la referencia de forma instantánea, y te permite guardarla como un gasto manual sin tener que escribir nada."
    },
    {
      q: "¿La aplicación tiene algún costo?",
      a: "Actualmente, durante nuestra etapa de lanzamiento y retroalimentación, el Plan Pro Ilimitado es completamente gratuito para todos los usuarios. Podrás subir facturas XML y capturas sin restricciones de volumen."
    }
  ];

  const features = [
    {
      icon: UploadCloud,
      title: "Carga de XML Masiva",
      desc: "Sube decenas de facturas CFDI 4.0 de forma paralela en segundos. El parser procesa conceptos, subtotal, IVA e importes al instante.",
      color: "from-blue-500 to-brand-cerulean",
      bg: "bg-blue-500/10"
    },
    {
      icon: ShieldCheck,
      title: "Clasificación por RFC",
      desc: "Identifica de forma automática qué facturas son de ingresos (emitidas por ti) y cuáles de egresos (recibidas de tus proveedores) usando tu clave fiscal.",
      color: "from-emerald-500 to-green-400",
      bg: "bg-emerald-500/10"
    },
    {
      icon: Camera,
      title: "Lectura de Transferencias (OCR)",
      desc: "Sube capturas de pantalla de tus comprobantes de banco (BBVA) y nuestro motor de visión extraerá montos, referencias y conceptos de forma autónoma.",
      color: "from-purple-500 to-indigo-500",
      bg: "bg-purple-500/10"
    },
    {
      icon: Wallet,
      title: "Conciliación de Carteras",
      desc: "Asocia tus facturas o gastos manuales a cuentas específicas (Efectivo, Nómina, Tarjeta de Crédito) para ver tu saldo neto consolidado en tiempo real.",
      color: "from-pink-500 to-rose-500",
      bg: "bg-pink-500/10"
    }
  ];

  return (
    <div className="min-h-screen bg-brand-smoke dark:bg-zinc-950 text-brand-carbon dark:text-zinc-100 transition-colors duration-300 font-sans selection:bg-brand-cerulean selection:text-white overflow-x-hidden">
      
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-200/50 dark:border-zinc-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-cerulean to-blue-400 flex items-center justify-center shadow-lg shadow-brand-cerulean/25">
              <Zap className="text-white w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-brand-carbon dark:text-white">
              Factura<span className="text-brand-cerulean">Control</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-brand-graphite dark:text-zinc-400">
            <a href="#features" className="hover:text-brand-cerulean transition-colors">Características</a>
            <a href="#mockup" className="hover:text-brand-cerulean transition-colors">Vista Previa</a>
            <a href="#pricing" className="hover:text-brand-cerulean transition-colors">Precios</a>
            <a href="#faq" className="hover:text-brand-cerulean transition-colors">Preguntas Frecuentes</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-semibold text-brand-graphite dark:text-zinc-300 hover:text-brand-cerulean dark:hover:text-white transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link 
              href="/register" 
              className="bg-brand-carbon dark:bg-white text-white dark:text-brand-carbon px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand-carbon/10 dark:shadow-white/5 hover:opacity-90 active:scale-95 transition-all"
            >
              Registrarse Gratis
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-brand-graphite dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-900"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 px-4 py-6 space-y-4 animate-in fade-in duration-200">
            <nav className="flex flex-col gap-4 text-base font-semibold text-brand-graphite dark:text-zinc-400">
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-cerulean">Características</a>
              <a href="#mockup" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-cerulean">Vista Previa</a>
              <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-cerulean">Precios</a>
              <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-cerulean">Preguntas Frecuentes</a>
            </nav>
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 dark:border-zinc-900">
              <Link 
                href="/login" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-center font-bold text-brand-graphite dark:text-zinc-300 py-3 hover:text-brand-cerulean"
              >
                Iniciar Sesión
              </Link>
              <Link 
                href="/register" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="bg-brand-cerulean text-white py-3 rounded-xl text-center font-bold shadow-md hover:bg-blue-600"
              >
                Comenzar Gratis
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 lg:pt-28 lg:pb-32 overflow-hidden">
        {/* Abstract Glowing Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-cerulean/20 dark:bg-brand-cerulean/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-cerulean/20 bg-brand-cerulean/5 text-brand-cerulean text-xs font-bold uppercase tracking-wider animate-pulse">
            <Zap className="w-3.5 h-3.5" /> Fase Beta Abierta • 100% Gratis
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-brand-carbon dark:text-white max-w-4xl mx-auto leading-[1.1]">
            Toma el control absoluto de tus <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cerulean via-blue-500 to-emerald-500">finanzas fiscales</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-brand-graphite dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            La forma más moderna de subir facturas XML del SAT, escanear capturas de pantalla de transferencias de banco mediante OCR y conciliar saldos netos en tiempo real desde cualquier dispositivo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link 
              href="/register" 
              className="w-full sm:w-auto bg-brand-cerulean hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-brand-cerulean/20 hover:shadow-brand-cerulean/30 active:scale-98 transition-all flex items-center justify-center gap-2 text-base"
            >
              Comenzar gratis ahora
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-brand-carbon dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800/80 px-8 py-4 rounded-2xl font-bold shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2 text-base"
            >
              Iniciar sesión
            </Link>
          </div>

          {/* Social Proof */}
          <div className="pt-6 flex flex-wrap justify-center items-center gap-8 text-xs text-brand-graphite dark:text-zinc-500 font-semibold uppercase tracking-wider">
            <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Sin tarjetas de crédito</div>
            <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Facturas XML Ilimitadas</div>
            <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Lector OCR Local (Privado)</div>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section id="features" className="py-20 bg-white dark:bg-zinc-900/40 border-y border-gray-200/50 dark:border-zinc-900/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold text-brand-cerulean uppercase tracking-widest">Tecnología Inteligente</h2>
            <p className="text-3xl font-extrabold text-brand-carbon dark:text-white tracking-tight">Todo lo que necesitas para tu contabilidad diaria</p>
            <p className="text-sm text-brand-graphite dark:text-zinc-400">Diseñado para personas físicas, freelances y emprendedores que buscan ordenar sus flujos reales de dinero.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div 
                  key={i} 
                  className="bg-brand-smoke dark:bg-zinc-900/50 border border-gray-150 dark:border-zinc-800/80 rounded-2xl p-6 relative group overflow-hidden hover:border-brand-cerulean/30 dark:hover:border-brand-cerulean/30 transition-all shadow-sm"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-6 text-white shadow-md`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-brand-carbon dark:text-white mb-2">{feat.title}</h3>
                  <p className="text-xs leading-relaxed text-brand-graphite dark:text-zinc-400">{feat.desc}</p>
                  
                  {/* Decorative background blur on hover */}
                  <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-brand-cerulean/5 group-hover:scale-150 rounded-full blur-xl transition-transform duration-500" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dashboard Preview / Mockup Section */}
      <section id="mockup" className="py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-xs font-bold text-brand-cerulean uppercase tracking-widest">Diseño Premium</h2>
            <p className="text-3xl font-extrabold text-brand-carbon dark:text-white tracking-tight">Experiencia Visual Excepcional</p>
            <p className="text-sm text-brand-graphite dark:text-zinc-400">Una interfaz oscura de alto contraste, limpia, responsiva y veloz adaptada perfectamente para tu teléfono.</p>
          </div>

          {/* Simulated App Dashboard Container */}
          <div className="relative mx-auto max-w-4xl bg-brand-carbon border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl shadow-brand-cerulean/5 select-none aspect-[16/10] sm:aspect-[16/9.5] transition-all">
            
            {/* Window bar */}
            <div className="bg-zinc-900/80 border-b border-zinc-800/60 px-6 py-4 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
              </div>
              <div className="bg-zinc-950/80 border border-zinc-800 px-8 py-1 rounded-full text-[10px] text-zinc-500 font-mono tracking-wider">
                facturacontrol.app/dashboard
              </div>
              <div className="w-10" />
            </div>

            {/* Dashboard Mockup Content */}
            <div className="p-6 sm:p-8 bg-zinc-950 text-zinc-300 font-sans h-full overflow-y-auto space-y-6">
              
              {/* Header and KPI cards */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-4">
                <div>
                  <h4 className="text-base font-bold text-white">Resumen Financiero</h4>
                  <p className="text-[10px] text-zinc-500">Vista consolidada de gastos y carteras</p>
                </div>
                <div className="bg-brand-cerulean/10 text-brand-cerulean text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border border-brand-cerulean/20">
                  Mes Actual
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl space-y-2">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase">Ingresos Totales</span>
                  <div className="text-lg font-black text-emerald-400">$34,500.00</div>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl space-y-2">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase">Gastos Totales</span>
                  <div className="text-lg font-black text-brand-cerulean">$12,840.50</div>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl space-y-2">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase">Disponible en Cuentas</span>
                  <div className="text-lg font-black text-purple-400">$21,659.50</div>
                </div>
              </div>

              {/* Two Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                {/* Chart Mock */}
                <div className="sm:col-span-8 bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase text-zinc-400">
                    <span>Tendencia Semanal</span>
                    <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                  <div className="h-28 flex items-end justify-between gap-1.5 pt-4">
                    <div className="w-full bg-brand-cerulean/30 rounded-t h-[40%]" />
                    <div className="w-full bg-brand-cerulean/30 rounded-t h-[60%]" />
                    <div className="w-full bg-brand-cerulean/50 rounded-t h-[30%]" />
                    <div className="w-full bg-brand-cerulean/80 rounded-t h-[85%]" />
                    <div className="w-full bg-brand-cerulean/40 rounded-t h-[50%]" />
                    <div className="w-full bg-brand-cerulean/90 rounded-t h-[70%]" />
                    <div className="w-full bg-brand-cerulean rounded-t h-[95%]" />
                  </div>
                </div>

                {/* Categories Mock */}
                <div className="sm:col-span-4 bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl space-y-3">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block">Categorías</span>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand-cerulean" /> Alimentación</span>
                      <span className="font-bold">45%</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500" /> Servicios</span>
                      <span className="font-bold">30%</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Transporte</span>
                      <span className="font-bold">15%</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-600" /> Otros</span>
                      <span className="font-bold">10%</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white dark:bg-zinc-900/40 border-y border-gray-200/50 dark:border-zinc-900/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold text-brand-cerulean uppercase tracking-widest">Suscripciones</h2>
            <p className="text-3xl font-extrabold text-brand-carbon dark:text-white tracking-tight">Planes Simples y Transparentes</p>
            <p className="text-sm text-brand-graphite dark:text-zinc-400">Sin plazos forzosos. Comienza gratis y escala cuando lo necesites.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free plan */}
            <div className="border border-gray-200 dark:border-zinc-800 bg-brand-smoke dark:bg-zinc-900/50 rounded-2xl p-8 relative flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-brand-carbon dark:text-white">Plan Inicial</h3>
                <p className="text-xs text-brand-graphite dark:text-zinc-500 mt-2">Para control básico de gastos en efectivo.</p>
                <div className="my-6">
                  <span className="text-4xl font-black text-brand-carbon dark:text-white">$0</span>
                  <span className="text-sm text-brand-graphite dark:text-zinc-500"> / mes</span>
                </div>
                <ul className="space-y-3 text-xs text-brand-graphite dark:text-zinc-400 border-t border-gray-250/50 dark:border-zinc-800/80 pt-6">
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Registro manual de transacciones</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Lector OCR de transferencias (5 / mes)</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Creación de hasta 2 carteras/cuentas</li>
                  <li className="text-gray-400 dark:text-zinc-650 flex items-center gap-2.5 line-through"><Check className="w-4 h-4 shrink-0" /> Carga de archivos XML de facturas</li>
                </ul>
              </div>
              <Link 
                href="/register" 
                className="mt-8 block text-center bg-gray-200 hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-brand-carbon dark:text-white py-3 rounded-xl font-bold text-sm active:scale-98 transition-all"
              >
                Comenzar Gratis
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="border-2 border-brand-cerulean bg-white dark:bg-zinc-900 rounded-2xl p-8 relative flex flex-col justify-between shadow-xl shadow-brand-cerulean/5">
              <div className="absolute -top-3.5 right-6 bg-brand-cerulean text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                Recomendado
              </div>
              <div>
                <h3 className="text-lg font-bold text-brand-carbon dark:text-white">Plan Pro Ilimitado</h3>
                <p className="text-xs text-brand-graphite dark:text-zinc-550 mt-2">Para control fiscal y automatización de gastos total.</p>
                <div className="my-6 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-brand-carbon dark:text-white">$0</span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Gratis por Lanzamiento</span>
                </div>
                <ul className="space-y-3 text-xs text-brand-graphite dark:text-zinc-400 border-t border-gray-150 dark:border-zinc-800 pt-6">
                  <li className="flex items-center gap-2.5 font-bold text-brand-carbon dark:text-zinc-200"><Check className="w-4 h-4 text-brand-cerulean shrink-0" /> Carga de XML ilimitada (Ingresos/Egresos)</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-brand-cerulean shrink-0" /> Clasificación inteligente por RFC fiscal</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-brand-cerulean shrink-0" /> Escáner OCR de comprobantes sin límites</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-brand-cerulean shrink-0" /> Carteras y conciliación bancaria ilimitadas</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-brand-cerulean shrink-0" /> Exportación de reportes a formato Excel (CSV)</li>
                </ul>
              </div>
              <Link 
                href="/register" 
                className="mt-8 block text-center bg-brand-cerulean hover:bg-blue-600 text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-brand-cerulean/20 active:scale-98 transition-all"
              >
                Comenzar gratis (Beta)
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 space-y-3">
            <HelpCircle className="w-10 h-10 text-brand-cerulean mx-auto opacity-80" />
            <h2 className="text-3xl font-extrabold text-brand-carbon dark:text-white tracking-tight">Preguntas Frecuentes</h2>
            <p className="text-sm text-brand-graphite dark:text-zinc-400">Todo lo que necesitas saber acerca de FacturaControl.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div 
                  key={index} 
                  className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-850 rounded-xl overflow-hidden shadow-sm transition-all"
                >
                  <button 
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left font-bold text-sm sm:text-base text-brand-carbon dark:text-white"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-brand-graphite shrink-0 transition-transform ${isOpen ? 'rotate-185' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-brand-graphite dark:text-zinc-400 border-t border-gray-100 dark:border-zinc-800/80 animate-in fade-in slide-in-from-top-1 duration-200 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-carbon text-zinc-550 py-12 border-t border-zinc-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-cerulean/25 flex items-center justify-center">
              <Zap className="text-brand-cerulean w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">
              Factura<span className="text-brand-cerulean">Control</span>
            </span>
          </div>

          <p className="text-xs text-zinc-500 text-center md:text-left">
            &copy; {new Date().getFullYear()} FacturaControl. Todos los derechos reservados. No afiliado directamente con el Servicio de Administración Tributaria (SAT).
          </p>

          <div className="flex gap-6 text-xs font-semibold text-zinc-400">
            <Link href="/login" className="hover:text-white transition-colors">Ingresar</Link>
            <Link href="/register" className="hover:text-white transition-colors">Registro</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
