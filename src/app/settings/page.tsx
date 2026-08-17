import React from "react";
import RFCManager from "@/components/settings/RFCManager";
import SystemResetManager from "@/components/settings/SystemResetManager";
import PageShell from "@/components/layout/PageShell";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  return (
    <PageShell
      eyebrow="Preferencias"
      title="Configuración"
      description="Gestiona tu identidad fiscal (RFC) y herramientas de mantenimiento del sistema."
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <RFCManager />
        <SystemResetManager />
      </div>
    </PageShell>
  );
}
