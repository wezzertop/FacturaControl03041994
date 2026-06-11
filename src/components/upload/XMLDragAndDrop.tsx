"use client";

import React, { useState, useCallback } from 'react';
import { UploadCloud, File, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { uploadXML } from '@/app/actions/upload';

export default function XMLDragAndDrop() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; progress: number; status: 'uploading' | 'success' | 'error' }[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processUpload = async (file: File) => {
    // 1. Agregar a la lista como subiendo
    setUploadedFiles(prev => [...prev, { name: file.name, progress: 20, status: 'uploading' }]);

    const formData = new FormData();
    formData.append('file', file);

    // 2. Llamar a la Server Action
    const result = await uploadXML(formData);

    // 3. Actualizar estado basado en la respuesta real
    if (result.success) {
      setUploadedFiles(prev => prev.map(f => f.name === file.name ? { ...f, progress: 100, status: 'success' } : f));
      
      // Redirigir al historial después de 1.5 segundos para que el usuario vea la palomita verde
      setTimeout(() => {
        window.location.href = '/invoices';
      }, 1500);
      
    } else {
      console.error("Error al subir:", result.error);
      setUploadedFiles(prev => prev.map(f => f.name === file.name ? { ...f, progress: 100, status: 'error' } : f));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(processUpload);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(processUpload);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Upload Zone */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative group rounded-xl border-2 border-dashed transition-all duration-300 p-12 text-center overflow-hidden
          ${isDragging 
            ? 'border-brand-cerulean bg-brand-cerulean/10 scale-[1.02]' 
            : 'border-gray-300 dark:border-zinc-800 bg-brand-white dark:bg-zinc-900/50 hover:border-gray-400 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900'
          }
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-brand-cerulean/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
          <div className={`p-4 rounded-full bg-brand-smoke dark:bg-brand-carbon border border-gray-200 dark:border-zinc-800 transition-transform duration-300 ${isDragging ? 'scale-110 text-brand-cerulean' : 'text-brand-graphite dark:text-zinc-400 group-hover:text-brand-cerulean'}`}>
            <UploadCloud className="w-10 h-10" />
          </div>
          
          <div>
            <p className="text-xl font-medium text-brand-carbon dark:text-zinc-100 mb-2">
              Arrastra tus archivos XML aquí
            </p>
            <p className="text-sm text-brand-graphite dark:text-zinc-400 mb-6">
              o haz clic para explorar tu equipo
            </p>
          </div>

          <label className="cursor-pointer inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-brand-cerulean to-[#005f80] hover:from-[#005f80] hover:to-[#004a66] transition-all duration-200 shadow-lg shadow-brand-cerulean/20 rounded-lg">
            Buscar Archivos
            <input 
              type="file" 
              className="hidden" 
              multiple 
              accept=".xml"
              onChange={handleFileInput}
            />
          </label>
        </div>
      </div>

      {/* Trust Message */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-zinc-900/80 border border-emerald-100 dark:border-zinc-800">
        <AlertCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-brand-carbon dark:text-zinc-200 mb-1">Tus datos están seguros</h4>
          <p className="text-sm text-brand-graphite dark:text-zinc-400 leading-relaxed">
            El SAT no penaliza ni restringe el uso de tus facturas para control financiero personal. Tus archivos se procesan de forma segura para extraer únicamente los datos relevantes para tu resumen de gastos.
          </p>
        </div>
      </div>

      {/* Upload Progress List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3 mt-8">
          <h3 className="text-sm font-medium text-brand-carbon dark:text-zinc-300 mb-4">Archivos Cargados</h3>
          {uploadedFiles.map((file, index) => (
            <div 
              key={`${file.name}-${index}`}
              className="flex items-center p-4 rounded-lg bg-brand-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div className="p-2 rounded-md bg-brand-smoke dark:bg-brand-carbon mr-4">
                <File className="w-5 h-5 text-brand-graphite dark:text-zinc-500" />
              </div>
              
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-sm font-medium text-brand-carbon dark:text-zinc-200 truncate">{file.name}</p>
                <div className="w-full bg-brand-smoke dark:bg-brand-carbon rounded-full h-1.5 mt-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${file.status === 'success' ? 'bg-emerald-500' : 'bg-brand-cerulean'}`}
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              </div>
              
              <div className="w-8 flex justify-end shrink-0">
                {file.status === 'success' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500 animate-in zoom-in duration-300" />
                )}
                {file.status === 'error' && (
                  <XCircle className="w-5 h-5 text-red-500 animate-in zoom-in duration-300" />
                )}
                {file.status === 'uploading' && (
                  <span className="text-xs font-medium text-brand-graphite dark:text-zinc-500">{Math.round(file.progress)}%</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
