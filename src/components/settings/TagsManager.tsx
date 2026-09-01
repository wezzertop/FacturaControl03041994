"use client";

import React, { useState, useTransition, useEffect } from "react";
import { 
  Tag, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  DollarSign, 
  Layers, 
  TrendingDown, 
  Sparkles,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { getUserTags, createCustomTag, renameUserTag, removeUserTag, TagSummary } from "@/app/actions/tags";

const TAG_COLOR_PALETTE = [
  "bg-emerald-500", "bg-blue-500", "bg-purple-600", "bg-amber-500",
  "bg-rose-500", "bg-teal-500", "bg-indigo-500", "bg-cyan-500",
  "bg-pink-500", "bg-orange-500", "bg-yellow-500", "bg-zinc-600"
];

export default function TagsManager() {
  const [tags, setTags] = useState<TagSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();

  // Crear nuevo tag
  const [newTagInput, setNewTagInput] = useState<string>("");
  const [newTagColor, setNewTagColor] = useState<string>("bg-emerald-500");

  // Editar tag
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadTags = async () => {
    try {
      const data = await getUserTags();
      setTags(data);
    } catch (err) {
      console.error("Error al cargar tags:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTagInput.trim().replace(/^#/, "");
    if (!clean) return;
    const formatted = `#${clean}`;

    if (tags.some((t) => t.tag.toLowerCase() === formatted.toLowerCase())) {
      setMessage({ type: "error", text: `El tag "${formatted}" ya existe.` });
      return;
    }

    startTransition(async () => {
      const res = await createCustomTag(formatted, newTagColor);
      if (res.success) {
        setTags([
          { tag: formatted, count: 0, totalSpent: 0, totalIncome: 0, color: newTagColor },
          ...tags
        ]);
        setNewTagInput("");
        setMessage({ type: "success", text: `Tag "${formatted}" guardado y sincronizado en todos tus dispositivos.` });
      } else {
        setMessage({ type: "error", text: res.error || "No se pudo guardar el tag." });
      }
    });
  };

  const handleStartEdit = (tag: string) => {
    setEditingTag(tag);
    setEditName(tag.replace(/^#/, ""));
  };

  const handleSaveRename = (oldTag: string) => {
    if (!editName.trim()) return;
    const cleanNew = `#${editName.trim().replace(/^#/, "")}`;

    startTransition(async () => {
      const res = await renameUserTag(oldTag, cleanNew);
      if (res.success) {
        setTags(tags.map((t) => t.tag === oldTag ? { ...t, tag: cleanNew } : t));
        setEditingTag(null);
        setMessage({ type: "success", text: `Tag renombrado a "${cleanNew}" en todas tus transacciones.` });
      } else {
        setMessage({ type: "error", text: res.error || "Error al renombrar." });
      }
    });
  };

  const handleDeleteTag = (tagToRemove: string) => {
    if (!confirm(`¿Eliminar el tag "${tagToRemove}" de todas tus transacciones?`)) return;

    startTransition(async () => {
      const res = await removeUserTag(tagToRemove);
      if (res.success) {
        setTags(tags.filter((t) => t.tag !== tagToRemove));
        setMessage({ type: "success", text: `Tag "${tagToRemove}" eliminado de tus transacciones.` });
      } else {
        setMessage({ type: "error", text: res.error || "Error al eliminar tag." });
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Notificaciones */}
      {message && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
          message.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
            : "bg-rose-500/10 border-rose-500/30 text-rose-400"
        }`}>
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </div>
          <button onClick={() => setMessage(null)} className="p-1 hover:opacity-80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Formulario Compacto para Crear Nuevo Tag */}
      <div className="surface-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0A0A0C] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-400" />
            Crear Nuevo #Tag Personalizado
          </h4>
          <span className="text-[10px] text-zinc-500">Usa tags para etiquetar eventos, viajes o negocios</span>
        </div>

        <form onSubmit={handleCreateTag} className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3 top-2 text-xs font-black text-zinc-500">#</span>
            <input
              type="text"
              placeholder="Nombre del tag (ej. ProyectoAlpha, ViajeCancun)"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 bg-slate-50 dark:bg-[#141418] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-white focus:outline-none"
            />
          </div>

          {/* Color Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            {TAG_COLOR_PALETTE.slice(0, 6).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewTagColor(c)}
                className={`w-5 h-5 rounded-full ${c} transition ${newTagColor === c ? "ring-2 ring-white scale-110" : "opacity-60"}`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={!newTagInput.trim()}
            className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-neutral-200 transition disabled:opacity-50 shrink-0"
          >
            + Guardar Tag
          </button>
        </form>
      </div>

      {/* Grid de Tags Administrables */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
            Tus #Tags Activos ({tags.length})
          </h4>
          <span className="text-[10px] text-zinc-500 font-bold">
            Gasto asociado acumulado
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-500 animate-pulse">
            Cargando tus tags...
          </div>
        ) : tags.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
            No tienes tags creados aún. Escribe uno arriba para comenzar.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {tags.map((t) => {
              const isEditing = editingTag === t.tag;

              return (
                <div
                  key={t.tag}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0A0C] border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between gap-2 hover:border-white/20 transition group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full ${t.color || "bg-emerald-500"} shrink-0`} />
                    
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2 py-0.5 bg-[#141418] border border-white/20 rounded-md text-xs font-bold text-white w-28 focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(t.tag)}
                          disabled={isPending}
                          className="p-1 rounded bg-emerald-500 text-black"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTag(null)}
                          className="p-1 rounded text-zinc-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <span className="text-xs font-black text-slate-900 dark:text-white block truncate">
                          {t.tag}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold block">
                          {t.count} movimiento{t.count === 1 ? "" : "s"} • ${t.totalSpent.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(t.tag)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
                        title="Renombrar tag"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTag(t.tag)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Eliminar tag de transacciones"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
