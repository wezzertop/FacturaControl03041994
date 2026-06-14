'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { 
  Tag, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, 
  ShoppingCart, Fuel, Zap, HeartPulse, Utensils, MoreHorizontal, 
  Tv, GraduationCap, Gift, PiggyBank, Eye
} from 'lucide-react';
import { createCategory, deleteCategory } from '@/app/actions/categories';

// Mapeo simple de iconos para previsualización
const IconMap: Record<string, any> = {
  ShoppingCart,
  Fuel,
  Zap,
  HeartPulse,
  Utensils,
  MoreHorizontal,
  Tv,
  GraduationCap,
  Gift,
  PiggyBank
};

// Paleta de colores Tailwind y nombres
const ColorPalette = [
  { class: 'bg-brand-cerulean', name: 'Cerúleo' },
  { class: 'bg-blue-400', name: 'Azul Claro' },
  { class: 'bg-emerald-500', name: 'Verde' },
  { class: 'bg-red-400', name: 'Rojo' },
  { class: 'bg-orange-400', name: 'Naranja' },
  { class: 'bg-purple-500', name: 'Púrpura' },
  { class: 'bg-gray-400', name: 'Gris' },
];

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  user_id: string | null;
}

interface CategoryManagerProps {
  initialCategories: Category[];
}

export default function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-brand-cerulean');
  const [selectedIcon, setSelectedIcon] = useState('ShoppingCart');
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Limpiar mensajes después de 4 segundos
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await createCategory(name, selectedColor, selectedIcon);
      if (res.success && res.category) {
        setCategories([...categories, res.category as Category]);
        setSuccessMessage(`Categoría "${name}" creada correctamente.`);
        setName('');
      } else {
        setErrorMessage(res.error || 'No se pudo crear la categoría.');
      }
    });
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría personalizada "${catName}"?`)) return;

    startTransition(async () => {
      const res = await deleteCategory(id);
      if (res.success) {
        setCategories(categories.filter(c => c.id !== id));
        setSuccessMessage(`Categoría eliminada.`);
      } else {
        setErrorMessage(res.error || 'No se pudo eliminar la categoría.');
      }
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      
      {/* Information Header */}
      <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/50 p-6 md:p-8 shadow-sm">
        <h3 className="text-base font-bold text-brand-carbon dark:text-white mb-6 flex items-center gap-2">
          <Tag className="w-5 h-5 text-brand-cerulean" />
          Administración de Categorías
        </h3>

        {successMessage && (
          <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3 flex gap-2 items-center animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl p-3 flex gap-2 items-center animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400 font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Create Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pb-6 border-b border-gray-150 dark:border-zinc-800/80">
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-graphite dark:text-zinc-500">Crear Nueva Categoría</h4>
          
          <div className="grid grid-cols-1 gap-4">
            {/* Name input */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-brand-graphite dark:text-zinc-400">Nombre de la Categoría</label>
              <input 
                type="text"
                required
                maxLength={30}
                placeholder="Ej. Suscripciones, Regalos, Mascotas"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-brand-smoke dark:bg-brand-carbon border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-base md:text-sm text-brand-carbon dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-650 focus:outline-none focus:border-brand-cerulean focus:ring-1 focus:ring-brand-cerulean transition-all"
              />
            </div>

            {/* Colors picker */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-brand-graphite dark:text-zinc-400 block">Color de Etiqueta</label>
              <div className="flex flex-wrap gap-2.5">
                {ColorPalette.map((color) => (
                  <button
                    key={color.class}
                    type="button"
                    onClick={() => setSelectedColor(color.class)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${color.class} hover:scale-110 active:scale-95 ${
                      selectedColor === color.class ? 'ring-2 ring-brand-carbon dark:ring-white scale-110' : 'opacity-80'
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Icons picker */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-brand-graphite dark:text-zinc-400 block">Icono de Categoría</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(IconMap).map((iconName) => {
                  const Icon = IconMap[iconName];
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setSelectedIcon(iconName)}
                      className={`p-2.5 rounded-lg border transition-all hover:bg-gray-100 dark:hover:bg-zinc-800 ${
                        selectedIcon === iconName 
                          ? 'border-brand-cerulean bg-brand-cerulean/10 text-brand-cerulean font-bold' 
                          : 'border-gray-200 dark:border-zinc-800 text-brand-graphite dark:text-zinc-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isPending || !name.trim()}
            className="w-full bg-brand-carbon dark:bg-white text-white dark:text-brand-carbon py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Agregar Categoría
          </button>
        </form>

        {/* Categories List */}
        <div className="pt-6 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-graphite dark:text-zinc-500 mb-4">Mis Categorías Activas</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
            {categories.map((cat) => {
              const IconComp = IconMap[cat.icon] || MoreHorizontal;
              const isSystem = !cat.user_id; // Si no tiene user_id, es del sistema
              
              return (
                <div 
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-150 dark:border-zinc-800/80 bg-brand-smoke/40 dark:bg-zinc-900/30"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${cat.color} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-carbon dark:text-white leading-tight">
                        {cat.name}
                      </p>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-brand-graphite dark:text-zinc-550 block">
                        {isSystem ? 'Sistema' : 'Personalizada'}
                      </span>
                    </div>
                  </div>

                  {!isSystem && (
                    <button 
                      onClick={() => handleDelete(cat.id, cat.name)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg text-brand-graphite dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-95 transition-all"
                      title="Eliminar Categoría"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
