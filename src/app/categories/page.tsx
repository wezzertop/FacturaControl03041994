import React from "react";
import CategoryManager from "@/components/settings/CategoryManager";
import { getCategories } from "@/app/actions/categories";
import PageShell from "@/components/layout/PageShell";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <PageShell
      eyebrow="Clasificación"
      title="Administración de Categorías"
      description="Crea, edita y personaliza los grupos de gastos e ingresos para organizar tus finanzas con colores e iconos."
    >
      <div className="mx-auto max-w-5xl">
        <CategoryManager initialCategories={categories} />
      </div>
    </PageShell>
  );
}
