"use client";

import React, { useCallback, useState } from "react";
import { AlertCircle, CheckCircle2, File, ShieldCheck, UploadCloud, XCircle } from "lucide-react";
import { uploadXML } from "@/app/actions/upload";

interface UploadedFile {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "success" | "error";
  errorMessage?: string;
}

export default function XMLDragAndDrop() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const processUpload = async (file: File) => {
    const fileId = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setUploadedFiles((prev) => [...prev, { id: fileId, name: file.name, progress: 20, status: "uploading" }]);

    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadXML(formData);

    if (result.success) {
      setUploadedFiles((prev) => prev.map((item) => (item.id === fileId ? { ...item, progress: 100, status: "success" } : item)));
    } else {
      setUploadedFiles((prev) =>
        prev.map((item) =>
          item.id === fileId
            ? { ...item, progress: 100, status: "error", errorMessage: result.error || "Error desconocido" }
            : item,
        ),
      );
    }
  };

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files?.length) {
      Array.from(event.dataTransfer.files).forEach(processUpload);
    }
  }, []);

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      Array.from(event.target.files).forEach(processUpload);
    }
  };

  const isUploadingAny = uploadedFiles.some((file) => file.status === "uploading");
  const totalSuccessCount = uploadedFiles.filter((file) => file.status === "success").length;
  const hasSuccessfulUpload = totalSuccessCount > 0;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[1fr_22rem]">
      <section className="surface-card rounded-lg p-4 sm:p-6">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`grid min-h-[22rem] place-items-center rounded-lg border-2 border-dashed p-6 text-center transition ${
            isDragging
              ? "border-brand-cerulean bg-brand-cerulean/10"
              : "border-slate-300 bg-white/50 hover:border-brand-cerulean/70 dark:border-white/10 dark:bg-white/5"
          }`}
        >
          <div className="max-w-md">
            <div className={`mx-auto grid h-16 w-16 place-items-center rounded-lg ${isDragging ? "bg-brand-cerulean text-white" : "bg-brand-cerulean/10 text-brand-cerulean"}`}>
              <UploadCloud className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">Arrastra tus XML aquí</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              También puedes seleccionar varios archivos desde tu equipo. Se procesan uno por uno y se agregan al historial.
            </p>
            <label className="mt-6 inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-brand-cerulean px-5 text-sm font-semibold text-white shadow-lg shadow-brand-cerulean/20 transition hover:bg-[#006C90] active:scale-[0.98]">
              Buscar archivos
              <input type="file" className="hidden" multiple accept=".xml" onChange={handleFileInput} />
            </label>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="surface-card rounded-lg p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Datos protegidos</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Tus XML se usan para control financiero personal y solo se extraen los datos necesarios para tus reportes.
              </p>
            </div>
          </div>
        </div>

        {!isUploadingAny && hasSuccessfulUpload ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  {totalSuccessCount === 1 ? "Factura procesada con éxito" : `${totalSuccessCount} facturas procesadas con éxito`}
                </p>
                <a href="/invoices" className="mt-3 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500">
                  Ver historial
                </a>
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-lg border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-cerulean" />
            <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
              Acepta archivos con extensión .xml. Si una factura ya existe o no cumple el formato, aparecerá aquí el motivo.
            </p>
          </div>
        </div>
      </aside>

      {uploadedFiles.length > 0 ? (
        <section className="surface-card rounded-lg p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Archivos procesados</h3>
            <button type="button" onClick={() => setUploadedFiles([])} className="text-xs font-semibold text-slate-500 transition hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
              Limpiar lista
            </button>
          </div>

          <div className="max-h-96 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-950/40">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400">
                  <File className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-950 dark:text-white">{file.name}</p>
                  {file.status === "uploading" ? (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                      <div className="h-full rounded-full bg-brand-cerulean transition-all" style={{ width: `${file.progress}%` }} />
                    </div>
                  ) : null}
                  {file.status === "error" && file.errorMessage ? <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">{file.errorMessage}</p> : null}
                </div>
                <div className="shrink-0">
                  {file.status === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : null}
                  {file.status === "error" ? <XCircle className="h-5 w-5 text-rose-500" /> : null}
                  {file.status === "uploading" ? <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{Math.round(file.progress)}%</span> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
