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
 * Obtiene el resumen de todos los tags usados en las transacciones del usuario,
 * combinando los predeterminados, los personalizados guardados en la nube y los de transacciones.
 */
export async function getUserTags(): Promise<TagSummary[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: transactions } = await (supabase.from("transactions") as any)
    .select("concept, amount, type")
    .eq("user_id", user.id);

  const tagMap = new Map<string, { count: number; totalSpent: number; totalIncome: number; color?: string }>();

  // 1. Inicializar tags predeterminados
  DEFAULT_TAGS.forEach((tag) => {
    tagMap.set(tag, { count: 0, totalSpent: 0, totalIncome: 0, color: TAG_COLOR_PALETTE[tag] || "bg-emerald-500" });
  });

  // 2. Cargar tags personalizados guardados en la nube (user_metadata)
  const customCloudTags: Array<{ tag: string; color: string }> = user.user_metadata?.custom_tags || [];
  customCloudTags.forEach((ct) => {
    if (!tagMap.has(ct.tag)) {
      tagMap.set(ct.tag, { count: 0, totalSpent: 0, totalIncome: 0, color: ct.color });
    } else {
      const existing = tagMap.get(ct.tag)!;
      existing.color = ct.color;
    }
  });

  // 3. Extraer tags de todas las transacciones históricas
  (transactions || []).forEach((t: any) => {
    const concept = t.concept || "";
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
    const color = stats.color || TAG_COLOR_PALETTE[tag] || colors[colorIdx++ % colors.length];
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
 * Guarda un nuevo tag personalizado en la nube para sincronizarlo en todos los dispositivos
 */
export async function createCustomTag(
  tag: string,
  color: string = "bg-emerald-500"
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Usuario no autenticado" };

  let cleanTag = tag.trim();
  if (!cleanTag.startsWith("#") && cleanTag !== "[Reembolso]") {
    cleanTag = `#${cleanTag}`;
  }

  const existingTags: Array<{ tag: string; color: string }> = user.user_metadata?.custom_tags || [];
  
  if (!existingTags.some((t) => t.tag.toLowerCase() === cleanTag.toLowerCase())) {
    const updated = [...existingTags, { tag: cleanTag, color }];
    const { error } = await supabase.auth.updateUser({
      data: { custom_tags: updated }
    });

    if (error) {
      console.error("Error al persistir tag en metadata:", error);
      return { success: false, error: "No se pudo sincronizar el tag en la nube." };
    }
  }

  revalidatePath("/categories");
  revalidatePath("/wallets");
  revalidatePath("/");
  return { success: true };
}

/**
 * Renombra un tag en todas las transacciones del usuario y en sus tags personalizados en la nube
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

  // 1. Actualizar en metadata en la nube
  const existingTags: Array<{ tag: string; color: string }> = user.user_metadata?.custom_tags || [];
  const updatedTags = existingTags.map((t) => (t.tag === cleanOld ? { ...t, tag: cleanNew } : t));
  await supabase.auth.updateUser({ data: { custom_tags: updatedTags } });

  // 2. Obtener transacciones que contienen oldTag
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
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  revalidatePath("/");
  return { success: true };
}

/**
 * Elimina un tag de todas las transacciones del usuario y de sus tags personalizados en la nube
 */
export async function removeUserTag(tagToRemove: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Usuario no autenticado" };

  const cleanTag = tagToRemove.trim();

  // 1. Remover de metadata en la nube
  const existingTags: Array<{ tag: string; color: string }> = user.user_metadata?.custom_tags || [];
  const updatedTags = existingTags.filter((t) => t.tag !== cleanTag);
  await supabase.auth.updateUser({ data: { custom_tags: updatedTags } });

  // 2. Remover de transacciones
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
  revalidatePath("/calendar");
  revalidatePath("/analytics");
  revalidatePath("/");
  return { success: true };
}
