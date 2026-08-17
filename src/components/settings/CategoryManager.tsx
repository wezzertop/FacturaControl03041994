'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { 
  Tag, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, 
  ShoppingCart, ShoppingBag, Store, CreditCard,
  Fuel, Car, Bus, Plane,
  Zap, Wifi, Tv, Smartphone, Home, Shield,
  HeartPulse, Stethoscope, Dumbbell,
  Utensils, Coffee, Pizza, Wine,
  GraduationCap, Briefcase, BookOpen, Laptop,
  Gift, Film, Music, Gamepad2, Ticket,
  PiggyBank, Landmark, TrendingUp, DollarSign,
  Search, Sparkles, Filter, MoreHorizontal, Edit2, Layers,
  ListFilter, Eye, Check
} from 'lucide-react';
import { createCategory, deleteCategory, updateCategory } from '@/app/actions/categories';

// Mapeo exhaustivo de iconos por familias
const ICON_CATEGORIES = [
  {
    category: "Compras & Tiendas",
    icons: [
      { name: "ShoppingCart", icon: ShoppingCart, label: "Carrito" },
      { name: "ShoppingBag", icon: ShoppingBag, label: "Bolsa" },
      { name: "Store", icon: Store, label: "Tienda" },
      { name: "CreditCard", icon: CreditCard, label: "Tarjeta" }
    ]
  },
  {
    category: "Transporte & Auto",
    icons: [
      { name: "Fuel", icon: Fuel, label: "Gasolina" },
      { name: "Car", icon: Car, label: "Auto" },
      { name: "Bus", icon: Bus, label: "Transporte" },
      { name: "Plane", icon: Plane, label: "Viajes" }
    ]
  },
  {
    category: "Servicios & Tecnología",
    icons: [
      { name: "Zap", icon: Zap, label: "Energía" },
      { name: "Wifi", icon: Wifi, label: "Internet" },
      { name: "Tv", icon: Tv, label: "TV/Stream" },
      { name: "Smartphone", icon: Smartphone, label: "Móvil" },
      { name: "Home", icon: Home, label: "Hogar" },
      { name: "Shield", icon: Shield, label: "Seguros" }
    ]
  },
  {
    category: "Alimentación & Salidas",
    icons: [
      { name: "Utensils", icon: Utensils, label: "Comida" },
      { name: "Coffee", icon: Coffee, label: "Café" },
      { name: "Pizza", icon: Pizza, label: "Restaurante" },
      { name: "Wine", icon: Wine, label: "Bares" }
    ]
  },
  {
    category: "Salud & Bienestar",
    icons: [
      { name: "HeartPulse", icon: HeartPulse, label: "Salud" },
      { name: "Stethoscope", icon: Stethoscope, label: "Médico" },
      { name: "Dumbbell", icon: Dumbbell, label: "Gimnasio" }
    ]
  },
  {
    category: "Educación & Trabajo",
    icons: [
      { name: "GraduationCap", icon: GraduationCap, label: "Escuela" },
      { name: "Briefcase", icon: Briefcase, label: "Trabajo" },
      { name: "BookOpen", icon: BookOpen, label: "Libros" },
      { name: "Laptop", icon: Laptop, label: "Equipos" }
    ]
  },
  {
    category: "Entretenimiento & Regalos",
    icons: [
      { name: "Gift", icon: Gift, label: "Regalo" },
      { name: "Film", icon: Film, label: "Cine" },
      { name: "Music", icon: Music, label: "Música" },
      { name: "Gamepad2", icon: Gamepad2, label: "Juegos" },
      { name: "Ticket", icon: Ticket, label: "Boletos" }
    ]
  },
  {
    category: "Finanzas & Inversión",
    icons: [
      { name: "PiggyBank", icon: PiggyBank, label: "Ahorro" },
      { name: "Landmark", icon: Landmark, label: "Banco" },
      { name: "TrendingUp", icon: TrendingUp, label: "Inversión" },
      { name: "DollarSign", icon: DollarSign, label: "Efectivo" }
    ]
  }
];

// Flat map para lookup rápido de componente de icono
const ALL_ICONS_MAP: Record<string, any> = {};
ICON_CATEGORIES.forEach(group => {
  group.icons.forEach(item => {
    ALL_ICONS_MAP[item.name] = item.icon;
  });
});

// Paleta de colores enriquecida
const ColorPalette = [
  { class: 'bg-brand-cerulean', name: 'Azul Cerúleo' },
  { class: 'bg-blue-500', name: 'Azul Eléctrico' },
  { class: 'bg-emerald-500', name: 'Verde Esmeralda' },
  { class: 'bg-teal-500', name: 'Verde Menta' },
  { class: 'bg-rose-500', name: 'Rojo Carmesí' },
  { class: 'bg-pink-500', name: 'Rosa Neón' },
  { class: 'bg-orange-500', name: 'Naranja Cálido' },
  { class: 'bg-amber-500', name: 'Ámbar Dorado' },
  { class: 'bg-purple-600', name: 'Púrpura' },
  { class: 'bg-indigo-600', name: 'Índigo' },
  { class: 'bg-violet-500', name: 'Violeta' },
  { class: 'bg-cyan-500', name: 'Cian' },
  { class: 'bg-lime-500', name: 'Lima' },
  { class: 'bg-slate-600', name: 'Gris Grafito' }
];

// Plantillas de creación rápida
const QUICK_TEMPLATES = [
  { name: 'Mascotas & Veterinaria', color: 'bg-amber-500', icon: 'HeartPulse' },
  { name: 'Suscripciones Streaming', color: 'bg-purple-600', icon: 'Tv' },
  { name: 'Gimnasio & Deporte', color: 'bg-emerald-500', icon: 'Dumbbell' },
  { name: 'Viajes & Hoteles', color: 'bg-blue-500', icon: 'Plane' },
  { name: 'Mantenimiento Hogar', color: 'bg-indigo-600', icon: 'Home' },
  { name: 'Cursos & Educación', color: 'bg-cyan-500', icon: 'GraduationCap' }
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
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Filtros y Buscador
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'custom' | 'system'>('all');
  const [selectedIconFamilyIndex, setSelectedIconFamilyIndex] = useState(0);

  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

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
      if (editingCategory) {
        const res = await updateCategory(editingCategory.id, name.trim(), selectedColor, selectedIcon);
        if (res.success && res.category) {
          setCategories(categories.map(c => c.id === editingCategory.id ? (res.category as Category) : c));
          setSuccessMessage(`Categoría "${name}" actualizada correctamente.`);
          handleCancelEdit();
        } else {
          setErrorMessage(res.error || 'No se pudo actualizar la categoría.');
        }
      } else {
        const res = await createCategory(name.trim(), selectedColor, selectedIcon);
        if (res.success && res.category) {
          setCategories([...categories, res.category as Category]);
          setSuccessMessage(`Categoría "${name}" creada correctamente.`);
          setName('');
          setSelectedColor('bg-brand-cerulean');
          setSelectedIcon('ShoppingCart');
        } else {
          setErrorMessage(res.error || 'No se pudo crear la categoría.');
        }
      }
    });
  };

  const handleApplyTemplate = (tpl: typeof QUICK_TEMPLATES[0]) => {
    setName(tpl.name);
    setSelectedColor(tpl.color);
    setSelectedIcon(tpl.icon);
  };

  const handleStartEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSelectedColor(cat.color);
    setSelectedIcon(cat.icon);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setName('');
    setSelectedColor('bg-brand-cerulean');
    setSelectedIcon('ShoppingCart');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría personalizada "${catName}"?`)) return;

    startTransition(async () => {
      const res = await deleteCategory(id);
      if (res.success) {
        setCategories(categories.filter(c => c.id !== id));
        setSuccessMessage(`Categoría "${catName}" eliminada.`);
        if (editingCategory?.id === id) {
          handleCancelEdit();
        }
      } else {
        setErrorMessage(res.error || 'No se pudo eliminar la categoría.');
      }
    });
  };

  // Filtrado dinámico
  const customCategoriesCount = categories.filter(c => c.user_id !== null).length;
  const systemCategoriesCount = categories.filter(c => c.user_id === null).length;

  const filteredCategories = categories.filter(cat => {
    // Filtro por tipo
    if (activeFilterTab === 'custom' && cat.user_id === null) return false;
    if (activeFilterTab === 'system' && cat.user_id !== null) return false;

    // Buscador por texto
    if (searchQuery.trim()) {
      return cat.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    }
    return true;
  });

  const PreviewIconComp = ALL_ICONS_MAP[selectedIcon] || ShoppingCart;

  return (
    <div className="space-y-6">

      {/* Tarjetas KPI de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Total Categorías</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{categories.length}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Grupos disponibles</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Personalizadas</p>
            <p className="text-2xl font-black text-brand-cerulean mt-1">{customCategoriesCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Creadas por ti</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="surface-card rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Del Sistema</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{systemCategoriesCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Estándar preconfiguradas</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Alertas de Notificación */}
      {successMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in zoom-in-95">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-500/15 border border-rose-500/30 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in zoom-in-95">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <p className="text-sm font-bold text-rose-800 dark:text-rose-300">{errorMessage}</p>
        </div>
      )}

      {/* Cuadrícula Principal Responsiva: Formulario + Lista de Categorías */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* --- COLUMNA IZQUIERDA (4 cols): FORMULARIO DE CREACIÓN & PREVISUALIZACIÓN --- */}
        <div className="lg:col-span-5 space-y-6">
          <div className="surface-card rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 shadow-sm space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {editingCategory ? <Edit2 className="w-4 h-4 text-brand-cerulean" /> : <Plus className="w-4 h-4 text-brand-cerulean" />}
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              {editingCategory && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs font-bold text-rose-500 hover:underline"
                >
                  Cancelar Edición
                </button>
              )}
            </div>

            {/* PREVISUALIZACIÓN EN TIEMPO REAL */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Previsualización:</span>
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <div className={`w-8 h-8 rounded-lg ${selectedColor} text-white flex items-center justify-center shadow-sm`}>
                  <PreviewIconComp className="w-4 h-4" />
                </div>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {name.trim() ? name : 'Nombre Categoría'}
                </span>
              </div>
            </div>

            {/* FORMULARIO */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Campo Nombre */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Nombre de la Categoría</label>
                <input 
                  type="text"
                  required
                  maxLength={30}
                  placeholder="Ej. Suscripciones, Regalos, Mascotas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-cerulean transition-all"
                />
              </div>

              {/* Selector de Colores (14 opciones) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">Color de Etiqueta</label>
                <div className="flex flex-wrap gap-2.5">
                  {ColorPalette.map((color) => (
                    <button
                      key={color.class}
                      type="button"
                      onClick={() => setSelectedColor(color.class)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${color.class} hover:scale-110 active:scale-95 ${
                        selectedColor === color.class ? 'ring-2 ring-slate-900 dark:ring-white scale-110 shadow-md' : 'opacity-85'
                      }`}
                      title={color.name}
                    >
                      {selectedColor === color.class && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de Iconos Organizado por Familias */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">Selecciona un Icono</label>
                
                {/* Pestañas de Familias de Iconos */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
                  {ICON_CATEGORIES.map((fam, idx) => (
                    <button
                      key={fam.category}
                      type="button"
                      onClick={() => setSelectedIconFamilyIndex(idx)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
                        selectedIconFamilyIndex === idx
                          ? 'bg-brand-cerulean text-white'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                      }`}
                    >
                      {fam.category.split(' ')[0]}
                    </button>
                  ))}
                </div>

                {/* Grid de Iconos de la Familia Seleccionada */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                  {ICON_CATEGORIES[selectedIconFamilyIndex].icons.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = selectedIcon === item.name;

                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setSelectedIcon(item.name)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          isSelected
                            ? 'border-brand-cerulean bg-brand-cerulean/15 text-brand-cerulean font-bold shadow-sm scale-105'
                            : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }`}
                        title={item.label}
                      >
                        <IconComp className="w-5 h-5" />
                        <span className="text-[9px] font-medium truncate w-full text-center">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botón de Envió */}
              <button
                type="submit"
                disabled={isPending || !name.trim()}
                className="w-full py-3 px-4 bg-brand-cerulean hover:bg-blue-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-brand-cerulean/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : editingCategory ? (
                  <Edit2 className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>{editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}</span>
              </button>
            </form>
          </div>

          {/* Plantillas Rápidas de Un Clic */}
          <div className="surface-card rounded-3xl border border-slate-200/80 dark:border-white/10 p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Plantillas Rápidas
            </h4>
            <div className="flex flex-wrap gap-2">
              {QUICK_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:border-brand-cerulean hover:text-brand-cerulean transition flex items-center gap-1.5"
                >
                  <span className={`w-2 h-2 rounded-full ${tpl.color}`} />
                  <span>{tpl.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- COLUMNA DERECHA (7 cols): GESTIÓN Y LISTADO DE CATEGORÍAS --- */}
        <div className="lg:col-span-7 space-y-4">
          <div className="surface-card rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 space-y-4 shadow-sm">
            
            {/* Barra Superior: Buscador y Filtros */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-zinc-800 pb-4">
              
              {/* Filtros de Pestaña */}
              <div className="inline-flex p-1 rounded-xl bg-slate-200/70 dark:bg-zinc-800 text-xs font-bold shrink-0">
                <button
                  onClick={() => setActiveFilterTab('all')}
                  className={`px-3 py-1.5 rounded-lg transition ${activeFilterTab === 'all' ? 'bg-white dark:bg-zinc-900 text-brand-cerulean shadow-sm' : 'text-slate-600 dark:text-zinc-400'}`}
                >
                  Todas ({categories.length})
                </button>
                <button
                  onClick={() => setActiveFilterTab('custom')}
                  className={`px-3 py-1.5 rounded-lg transition ${activeFilterTab === 'custom' ? 'bg-white dark:bg-zinc-900 text-purple-600 shadow-sm' : 'text-slate-600 dark:text-zinc-400'}`}
                >
                  Personalizadas ({customCategoriesCount})
                </button>
                <button
                  onClick={() => setActiveFilterTab('system')}
                  className={`px-3 py-1.5 rounded-lg transition ${activeFilterTab === 'system' ? 'bg-white dark:bg-zinc-900 text-emerald-600 shadow-sm' : 'text-slate-600 dark:text-zinc-400'}`}
                >
                  Sistema ({systemCategoriesCount})
                </button>
              </div>

              {/* Buscador de Categorías */}
              <div className="relative shrink-0 w-full sm:w-56">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar categoría..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-cerulean"
                />
              </div>
            </div>

            {/* Listado de Tarjetas de Categorías */}
            {filteredCategories.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-zinc-500">
                <Tag className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-700 mb-2" />
                <p className="text-sm font-medium">No se encontraron categorías con ese criterio.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredCategories.map((cat) => {
                  const IconComp = ALL_ICONS_MAP[cat.icon] || Tag;
                  const isSystem = cat.user_id === null;

                  return (
                    <div
                      key={cat.id}
                      className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-zinc-900/40 hover:border-brand-cerulean/40 transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl ${cat.color} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {cat.name}
                          </p>
                          <span className={`inline-block text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5 ${
                            isSystem 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                          }`}>
                            {isSystem ? 'Sistema' : 'Personalizada'}
                          </span>
                        </div>
                      </div>

                      {!isSystem && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(cat)}
                            disabled={isPending}
                            className="p-2 rounded-xl text-slate-400 hover:text-brand-cerulean hover:bg-brand-cerulean/10 transition"
                            title="Editar Categoría"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat.id, cat.name)}
                            disabled={isPending}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                            title="Eliminar Categoría"
                          >
                            <Trash2 className="w-4 h-4" />
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

      </div>

    </div>
  );
}
