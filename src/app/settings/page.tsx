import React from "react";
import SystemPreferencesManager from "@/components/settings/SystemPreferencesManager";
import SystemResetManager from "@/components/settings/SystemResetManager";
import PageShell from "@/components/layout/PageShell";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  return (
    <PageShell
      eyebrow="Personalización"
      title="Preferencias del Sistema"
      description="Personaliza tu experiencia visual, divisas y herramientas de mantenimiento de datos."
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <SystemPreferencesManager />
        <SystemResetManager />
      </div>
    </PageShell>
  );
}
