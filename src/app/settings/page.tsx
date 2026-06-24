import React from "react";
import RFCManager from "@/components/settings/RFCManager";
import CategoryManager from "@/components/settings/CategoryManager";
import { getCategories } from "@/app/actions/categories";
import PageShell from "@/components/layout/PageShell";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const categories = await getCategories();

  return (
    <PageShell
      eyebrow="Preferencias"
      title="Configuración"
      description="Gestiona tu identidad fiscal, categorías y reglas de organización para mantener tu información consistente."
    >
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <RFCManager />
        <CategoryManager initialCategories={categories} />
      </div>
    </PageShell>
  );
}
