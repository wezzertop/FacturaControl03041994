"use client";

import React, { useState } from 'react';
import { Lock, ShieldCheck, Key, FileSignature, Upload, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function SATConnectionCards() {
  const [activeTab, setActiveTab] = useState<'ciec' | 'efirma'>('ciec');

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-brand-carbon dark:text-white tracking-tight">Conexión Automática con el SAT</h2>
        <p className="text-sm text-brand-graphite dark:text-zinc-400 mt-1">
          Sincroniza tus facturas (CFDI 4.0) de forma automática y en segundo plano. 
          Selecciona el método de conexión que prefieras.
        </p>
      </div>

      {/* Trust Banner */}
      <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4 flex gap-4 items-start">
        <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Seguridad de Grado Bancario</h4>
          <p className="text-sm text-emerald-600 dark:text-emerald-500/80 mt-1 leading-relaxed">
            Tus credenciales se cifran de extremo a extremo (AES-256) antes de salir de tu dispositivo. 
            Se procesan en entornos aislados y se utilizan únicamente mediante tokens firmados para descargar 
            tu información fiscal. Nunca compartimos tus datos con terceros.
          </p>
        </div>
      </div>

      {/* Connection Cards Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        
        {/* CIEC Card */}
        <div 
          onClick={() => setActiveTab('ciec')}
          className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer ${
            activeTab === 'ciec' 
              ? 'border-brand-cerulean bg-brand-white dark:bg-zinc-900/80 shadow-lg shadow-brand-cerulean/10' 
              : 'border-gray-200 dark:border-zinc-800 bg-brand-smoke dark:bg-brand-carbon hover:border-gray-300 dark:hover:border-zinc-700'
          }`}
        >
          {activeTab === 'ciec' && (
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-cerulean to-[#004a66]" />
          )}
          
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className={`p-3 rounded-xl ${activeTab === 'ciec' ? 'bg-brand-cerulean/10 text-brand-cerulean' : 'bg-brand-white dark:bg-zinc-900 text-brand-graphite dark:text-zinc-500'}`}>
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${activeTab === 'ciec' ? 'text-brand-carbon dark:text-white' : 'text-brand-graphite dark:text-zinc-300'}`}>Contraseña (CIEC)</h3>
                <p className="text-xs text-brand-graphite dark:text-zinc-500">Ideal para personas físicas</p>
              </div>
              {activeTab === 'ciec' && <CheckCircle2 className="w-5 h-5 text-brand-cerulean ml-auto" />}
            </div>

            <div className={`space-y-4 transition-all duration-300 ${activeTab === 'ciec' ? 'opacity-100 h-auto' : 'opacity-50 h-[180px] overflow-hidden pointer-events-none'}`}>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-brand-graphite dark:text-zinc-400 ml-1">RFC</label>
                <input 
                  type="text" 
                  placeholder="Ej. ABCD123456EF7"
                  className="w-full bg-brand-smoke dark:bg-brand-carbon border border-gray-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-brand-carbon dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-brand-cerulean focus:ring-1 focus:ring-brand-cerulean transition-all uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-brand-graphite dark:text-zinc-400 ml-1">Contraseña SAT</label>
                <div className="relative">
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full bg-brand-smoke dark:bg-brand-carbon border border-gray-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-brand-carbon dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-brand-cerulean focus:ring-1 focus:ring-brand-cerulean transition-all"
                  />
                  <Lock className="w-4 h-4 text-brand-graphite dark:text-zinc-500 absolute right-3 top-3" />
                </div>
              </div>

              <button className="w-full mt-6 bg-gradient-to-r from-brand-cerulean to-[#005f80] hover:from-[#005f80] hover:to-[#004a66] text-white font-medium text-sm py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 group">
                Conectar con CIEC
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* e.firma Card */}
        <div 
          onClick={() => setActiveTab('efirma')}
          className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer ${
            activeTab === 'efirma' 
              ? 'border-emerald-500 bg-brand-white dark:bg-zinc-900/80 shadow-lg shadow-emerald-500/10' 
              : 'border-gray-200 dark:border-zinc-800 bg-brand-smoke dark:bg-brand-carbon hover:border-gray-300 dark:hover:border-zinc-700'
          }`}
        >
          {activeTab === 'efirma' && (
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-700" />
          )}

          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className={`p-3 rounded-xl ${activeTab === 'efirma' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-brand-white dark:bg-zinc-900 text-brand-graphite dark:text-zinc-500'}`}>
                <FileSignature className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${activeTab === 'efirma' ? 'text-brand-carbon dark:text-white' : 'text-brand-graphite dark:text-zinc-300'}`}>e.firma (Fiel)</h3>
                <p className="text-xs text-brand-graphite dark:text-zinc-500">Más rápido y seguro (Recomendado)</p>
              </div>
              {activeTab === 'efirma' && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500 ml-auto" />}
            </div>

            <div className={`space-y-4 transition-all duration-300 ${activeTab === 'efirma' ? 'opacity-100 h-auto' : 'opacity-50 h-[180px] overflow-hidden pointer-events-none'}`}>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-dashed border-gray-300 dark:border-zinc-700 rounded-lg bg-brand-smoke dark:bg-brand-carbon p-4 text-center hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-colors group">
                  <Upload className="w-5 h-5 text-brand-graphite dark:text-zinc-500 mx-auto mb-2 group-hover:text-emerald-500 transition-colors" />
                  <p className="text-xs font-medium text-brand-carbon dark:text-zinc-300">Archivo .cer</p>
                  <p className="text-[10px] text-brand-graphite dark:text-zinc-500 mt-1">Certificado</p>
                </div>
                
                <div className="border border-dashed border-gray-300 dark:border-zinc-700 rounded-lg bg-brand-smoke dark:bg-brand-carbon p-4 text-center hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-colors group">
                  <Upload className="w-5 h-5 text-brand-graphite dark:text-zinc-500 mx-auto mb-2 group-hover:text-emerald-500 transition-colors" />
                  <p className="text-xs font-medium text-brand-carbon dark:text-zinc-300">Archivo .key</p>
                  <p className="text-[10px] text-brand-graphite dark:text-zinc-500 mt-1">Llave privada</p>
                </div>
              </div>

              <div className="space-y-1.5 mt-2">
                <label className="text-xs font-medium text-brand-graphite dark:text-zinc-400 ml-1">Contraseña de Clave Privada</label>
                <div className="relative">
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full bg-brand-smoke dark:bg-brand-carbon border border-gray-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-brand-carbon dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  <Lock className="w-4 h-4 text-brand-graphite dark:text-zinc-500 absolute right-3 top-3" />
                </div>
              </div>

              <button className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-medium text-sm py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 group shadow-lg shadow-emerald-900/20">
                Conectar con e.firma
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

      </div>
      
      {/* Help Note */}
      <p className="text-xs text-center text-brand-graphite dark:text-zinc-500 max-w-2xl mx-auto pt-4">
        Al hacer clic en conectar, aceptas los términos de servicio para la recuperación de comprobantes fiscales. 
        Este proceso puede tardar unos minutos en la primera sincronización dependiendo de la disponibilidad de los servicios del SAT.
      </p>
    </div>
  );
}
