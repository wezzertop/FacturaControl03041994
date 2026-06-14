"use client";

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { 
  Lock, ShieldCheck, Key, FileSignature, Upload, ChevronRight, 
  CheckCircle2, RefreshCw, LogOut, Check, AlertCircle, FileText
} from 'lucide-react';
import { getSATConnection, connectSAT, disconnectSAT, syncSAT } from '@/app/actions/sat';

export default function SATConnectionCards() {
  const [activeTab, setActiveTab] = useState<'ciec' | 'efirma'>('ciec');
  const [connection, setConnection] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [needsMigration, setNeedsMigration] = useState(false);

  // Form CIEC
  const [ciecRfc, setCiecRfc] = useState('');
  const [ciecPassword, setCiecPassword] = useState('');

  // Form e.firma
  const [efirmaRfc, setEfirmaRfc] = useState('');
  const [cerFile, setCerFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [efirmaPassword, setEfirmaPassword] = useState('');

  // File Input Refs
  const cerInputRef = useRef<HTMLInputElement>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);

  // Cargar estado inicial al montar
  useEffect(() => {
    loadConnection();
  }, []);

  const loadConnection = async () => {
    setIsLoading(true);
    const res = await getSATConnection();
    if (res.success && res.data) {
      setConnection(res.data);
      if (res.data.needs_migration) {
        setNeedsMigration(true);
      }
    } else {
      setConnection(null);
    }
    setIsLoading(false);
  };

  // Conectar con CIEC
  const handleCIECSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ciecRfc || !ciecPassword) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await connectSAT({
        rfc: ciecRfc,
        password: ciecPassword,
        method: 'ciec'
      });

      if (res.success) {
        setSuccessMessage(res.message || 'Conectado con éxito.');
        if (res.needs_migration) {
          setNeedsMigration(true);
        }
        await loadConnection();
      } else {
        setErrorMessage(res.error || 'Error al conectar con el SAT');
      }
    });
  };

  // Conectar con e.firma
  const handleEfirmaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!efirmaRfc || !cerFile || !keyFile || !efirmaPassword) {
      setErrorMessage('Por favor completa todos los campos y sube los archivos de la e.firma.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await connectSAT({
        rfc: efirmaRfc,
        password: efirmaPassword,
        method: 'efirma',
        cerName: cerFile.name,
        keyName: keyFile.name
      });

      if (res.success) {
        setSuccessMessage(res.message || 'Conectado con éxito con e.firma.');
        if (res.needs_migration) {
          setNeedsMigration(true);
        }
        await loadConnection();
      } else {
        setErrorMessage(res.error || 'Error al conectar con e.firma.');
      }
    });
  };

  // Sincronizar Ahora
  const handleSyncNow = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await syncSAT();
      if (res.success) {
        setSuccessMessage('Sincronización completada. Se descargaron nuevas facturas XML del SAT.');
        await loadConnection();
      } else {
        setErrorMessage(res.error || 'Error al sincronizar facturas.');
      }
    });
  };

  // Desconectar
  const handleDisconnect = async () => {
    if (!confirm('¿Estás seguro de desconectar tu cuenta del SAT? Se eliminarán tus credenciales de sincronización automática.')) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await disconnectSAT();
      if (res.success) {
        setConnection(null);
        setNeedsMigration(false);
        setCiecRfc('');
        setCiecPassword('');
        setEfirmaRfc('');
        setCerFile(null);
        setKeyFile(null);
        setEfirmaPassword('');
        setSuccessMessage('Desconectado con éxito del SAT.');
      } else {
        setErrorMessage(res.error || 'Error al desconectar.');
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <RefreshCw className="w-8 h-8 text-brand-cerulean animate-spin" />
        <p className="text-sm text-brand-graphite dark:text-zinc-400">Verificando estado de conexión con el SAT...</p>
      </div>
    );
  }

  // Renderizar estado CONECTADO
  if (connection && (connection.status === 'connected' || connection.status === 'error')) {
    const isCIEC = connection.method === 'ciec';
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-brand-carbon dark:text-white tracking-tight">Sincronización SAT Activa</h2>
          <p className="text-sm text-brand-graphite dark:text-zinc-400 mt-1">
            Tu cuenta está vinculada y el sistema descarga tus facturas automáticamente en segundo plano.
          </p>
        </div>

        {/* Feedback Messages */}
        {successMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-4 flex gap-3 items-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl p-4 flex gap-3 items-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">{errorMessage}</p>
          </div>
        )}

        {/* DB Migration Pending Notice */}
        {needsMigration && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-700 dark:text-amber-400 font-bold">Modo Demo / Advertencia de Tabla SQL</p>
              <p className="text-xs text-amber-600 dark:text-amber-400/80 mt-1 leading-relaxed">
                El sistema está corriendo en modo simulación de desarrollo local porque no se ha creado la tabla <code>sat_connections</code> en tu base de datos de Supabase.
                Para que persista en base de datos de producción, ejecuta el script <a href="file:///c:/Users/duart/OneDrive/Documentos/Aplicacion_Facturas/supabase/add_sat_connections.sql" className="underline font-semibold text-amber-700 dark:text-amber-400">add_sat_connections.sql</a> en tu Supabase SQL Editor.
              </p>
            </div>
          </div>
        )}

        {/* Active Connection Card */}
        <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/50 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Conectado al SAT
                </span>
                <span className="text-xs text-brand-graphite dark:text-zinc-500 font-semibold uppercase">
                  Vía {isCIEC ? 'CIEC (Contraseña)' : 'e.firma (Fiel)'}
                </span>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-brand-graphite dark:text-zinc-500">RFC Sincronizado</p>
                <h3 className="text-2xl font-black text-brand-carbon dark:text-white tracking-tight uppercase mt-0.5">
                  {connection.rfc}
                </h3>
              </div>

              <div className="text-xs text-brand-graphite dark:text-zinc-400">
                <span className="font-semibold text-brand-carbon dark:text-white">Última descarga automática: </span>
                {connection.last_sync ? formatDate(connection.last_sync) : 'Sincronización inicial pendiente'}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto self-stretch md:self-auto justify-end">
              <button
                disabled={isPending}
                onClick={handleSyncNow}
                className="w-full sm:w-auto bg-brand-carbon dark:bg-white text-white dark:text-brand-carbon px-5 py-3 rounded-xl text-xs font-bold hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {isPending ? 'Sincronizando...' : 'Sincronizar ahora'}
              </button>
              
              <button
                disabled={isPending}
                onClick={handleDisconnect}
                className="w-full sm:w-auto border border-gray-200 dark:border-zinc-800 bg-transparent text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-5 py-3 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                Desconectar SAT
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar Formularios de Conexión (DESCONECTADO)
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

      {/* Feedback Messages */}
      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-4 flex gap-3 items-center">
          <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl p-4 flex gap-3 items-center">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">{errorMessage}</p>
        </div>
      )}

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

            <form onSubmit={handleCIECSubmit} onClick={(e) => e.stopPropagation()} className={`space-y-4 transition-all duration-300 ${activeTab === 'ciec' ? 'opacity-100 h-auto' : 'opacity-50 h-[180px] overflow-hidden pointer-events-none'}`}>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-brand-graphite dark:text-zinc-400 ml-1">RFC</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. ABCD123456EF7"
                  value={ciecRfc}
                  onChange={(e) => setCiecRfc(e.target.value)}
                  className="w-full bg-brand-smoke dark:bg-brand-carbon border border-gray-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-brand-carbon dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-605 focus:outline-none focus:border-brand-cerulean focus:ring-1 focus:ring-brand-cerulean transition-all uppercase font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-brand-graphite dark:text-zinc-400 ml-1">Contraseña SAT</label>
                <div className="relative">
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={ciecPassword}
                    onChange={(e) => setCiecPassword(e.target.value)}
                    className="w-full bg-brand-smoke dark:bg-brand-carbon border border-gray-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-brand-carbon dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-605 focus:outline-none focus:border-brand-cerulean focus:ring-1 focus:ring-brand-cerulean transition-all"
                  />
                  <Lock className="w-4 h-4 text-brand-graphite dark:text-zinc-500 absolute right-3 top-3" />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isPending}
                className="w-full mt-6 bg-gradient-to-r from-brand-cerulean to-[#005f80] hover:from-[#005f80] hover:to-[#004a66] text-white font-medium text-sm py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Conectar con CIEC
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
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

            <form onSubmit={handleEfirmaSubmit} onClick={(e) => e.stopPropagation()} className={`space-y-4 transition-all duration-300 ${activeTab === 'efirma' ? 'opacity-100 h-auto' : 'opacity-50 h-[180px] overflow-hidden pointer-events-none'}`}>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-brand-graphite dark:text-zinc-400 ml-1">RFC de la e.firma</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. ABCD123456EF7"
                  value={efirmaRfc}
                  onChange={(e) => setEfirmaRfc(e.target.value)}
                  className="w-full bg-brand-smoke dark:bg-brand-carbon border border-gray-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-brand-carbon dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-650 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all uppercase font-mono animate-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* File Cer input */}
                <input 
                  type="file" 
                  ref={cerInputRef}
                  accept=".cer"
                  className="hidden"
                  onChange={(e) => setCerFile(e.target.files?.[0] || null)}
                />
                <div 
                  onClick={() => cerInputRef.current?.click()}
                  className={`border border-dashed rounded-lg bg-brand-smoke dark:bg-brand-carbon p-3 text-center transition-colors group cursor-pointer ${
                    cerFile ? 'border-emerald-500 bg-emerald-50/10' : 'border-gray-300 dark:border-zinc-750 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/5'
                  }`}
                >
                  {cerFile ? (
                    <>
                      <FileText className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                      <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 truncate px-1">{cerFile.name}</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-brand-graphite dark:text-zinc-500 mx-auto mb-1 group-hover:text-emerald-500 transition-colors" />
                      <p className="text-xs font-medium text-brand-carbon dark:text-zinc-300">Archivo .cer</p>
                    </>
                  )}
                  <p className="text-[9px] text-brand-graphite dark:text-zinc-500">Certificado</p>
                </div>
                
                {/* File Key input */}
                <input 
                  type="file" 
                  ref={keyInputRef}
                  accept=".key"
                  className="hidden"
                  onChange={(e) => setKeyFile(e.target.files?.[0] || null)}
                />
                <div 
                  onClick={() => keyInputRef.current?.click()}
                  className={`border border-dashed rounded-lg bg-brand-smoke dark:bg-brand-carbon p-3 text-center transition-colors group cursor-pointer ${
                    keyFile ? 'border-emerald-500 bg-emerald-50/10' : 'border-gray-300 dark:border-zinc-755 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/5'
                  }`}
                >
                  {keyFile ? (
                    <>
                      <FileText className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                      <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 truncate px-1">{keyFile.name}</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-brand-graphite dark:text-zinc-500 mx-auto mb-1 group-hover:text-emerald-500 transition-colors" />
                      <p className="text-xs font-medium text-brand-carbon dark:text-zinc-300">Archivo .key</p>
                    </>
                  )}
                  <p className="text-[9px] text-brand-graphite dark:text-zinc-500">Llave privada</p>
                </div>
              </div>

              <div className="space-y-1.5 mt-2">
                <label className="text-xs font-medium text-brand-graphite dark:text-zinc-400 ml-1">Contraseña de Clave Privada</label>
                <div className="relative">
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={efirmaPassword}
                    onChange={(e) => setEfirmaPassword(e.target.value)}
                    className="w-full bg-brand-smoke dark:bg-brand-carbon border border-gray-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-brand-carbon dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-650 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  <Lock className="w-4 h-4 text-brand-graphite dark:text-zinc-500 absolute right-3 top-3" />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isPending}
                className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-medium text-sm py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 group shadow-lg shadow-emerald-900/20 disabled:opacity-50"
              >
                {isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Conectar con e.firma
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
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
