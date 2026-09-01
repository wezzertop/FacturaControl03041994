"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export interface TagSummary {
  tag: string;
  count: number;
  totalSpent: number;
  totalIncome: number;
  color: string;
}

const TAG_COLOR_PALETTE: Record<string, string> = {
  "#Deducible": "bg-emerald-500",
  "#Vacaciones": "bg-blue-500",
  "#Negocio": "bg-purple-600",
  "#Hogar": "bg-amber-500",
  "#Mascotas": "bg-rose-500",
  "#Extra": "bg-indigo-500",
  "#Proyecto": "bg-teal-500",
  "#Personal": "bg-cyan-500",
  "#Salud": "bg-pink-500",
  "[Reembolso]": "bg-emerald-600"
};

const DEFAULT_TAGS = [
  "#Deducible",
  "#Vacaciones",
  "#Negocio",
  "#Hogar",
  "#Mascotas",
  "#Extra",
  "#Proyecto",
  "#Personal"
];

/**
 * Obtiene el resumen de todos los tags usados en las transacciones del usuario
 */
export async function getUserTags(): Promise<TagSummary[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: transactions } = await (supabase.from("transactions") as any)
    .select("concept, amount, type")
    .eq("user_id", user.id);

  const tagMap = new Map<string, { count: number; totalSpent: number; totalIncome: number }>();

  // Inicializar tags predeterminados
  DEFAULT_TAGS.forEach((tag) => {
    tagMap.set(tag, { count: 0, totalSpent: 0, totalIncome: 0 });
  });

  // Extraer tags de transacciones
  (transactions || []).forEach((t: any) => {
    const concept = t.concept || "";
    // Buscar todos los tokens que empiezan con # o [Reembolso]
    const matches = concept.match(/(#[a-zA-Z0-9_]+|\[Reembolso\])/g) || [];
    
    matches.forEach((tag: string) => {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, { count: 0, totalSpent: 0, totalIncome: 0 });
      }
      const item = tagMap.get(tag)!;
      item.count += 1;
      const amt = Number(t.amount || 0);
      if (t.type === "expense") {
        item.totalSpent += amt;
      } else if (t.type === "income") {
        item.totalIncome += amt;
      }
    });
  });

  const colors = [
    "bg-emerald-500", "bg-blue-500", "bg-purple-600", "bg-amber-500",
    "bg-rose-500", "bg-teal-500", "bg-indigo-500", "bg-cyan-500",
    "bg-pink-500", "bg-orange-500", "bg-yellow-500"
  ];

  let colorIdx = 0;
  return Array.from(tagMap.entries()).map(([tag, stats]) => {
    const color = TAG_COLOR_PALETTE[tag] || colors[colorIdx++ % colors.length];
    return {
      tag,
      count: stats.count,
      totalSpent: stats.totalSpent,
      totalIncome: stats.totalIncome,
      color
    };
  }).sort((a, b) => b.count - a.count);
}

/**
 * Renombra un tag en todas las transacciones del usuario
 */
export async function renameUserTag(oldTag: string, newTag: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Usuario no autenticado" };

  const cleanOld = oldTag.trim();
  let cleanNew = newTag.trim();
  if (!cleanNew.startsWith("#") && cleanNew !== "[Reembolso]") {
    cleanNew = `#${cleanNew}`;
  }

  // Obtener transacciones que contienen oldTag
  const { data: transactions, error } = await (supabase.from("transactions") as any)
    .select("id, concept")
    .eq("user_id", user.id)
    .ilike("concept", `%${cleanOld}%`);

  if (error) return { success: false, error: "Error al buscar transacciones" };

  for (const t of (transactions || [])) {
    const updatedConcept = (t.concept || "").replace(new RegExp(cleanOld, "gi"), cleanNew);
    await (supabase.from("transactions") as any)
      .update({ concept: updatedConcept })
      .eq("id", t.id)
      .eq("user_id", user.id);
  }

  revalidatePath("/categories");
  revalidatePath("/wallets");
  revalidatePath("/");
  return { success: true };
}

/**
 * Elimina un tag de todas las transacciones del usuario
 */
export async function removeUserTag(tagToRemove: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Usuario no autenticado" };

  const cleanTag = tagToRemove.trim();

  const { data: transactions, error } = await (supabase.from("transactions") as any)
    .select("id, concept")
    .eq("user_id", user.id)
    .ilike("concept", `%${cleanTag}%`);

  if (error) return { success: false, error: "Error al buscar transacciones" };

  for (const t of (transactions || [])) {
    const updatedConcept = (t.concept || "")
      .replace(new RegExp(cleanTag, "gi"), "")
      .replace(/\s+/g, " ")
      .trim();

    await (supabase.from("transactions") as any)
      .update({ concept: updatedConcept })
      .eq("id", t.id)
      .eq("user_id", user.id);
  }

  revalidatePath("/categories");
  revalidatePath("/wallets");
  revalidatePath("/");
  return { success: true };
}
