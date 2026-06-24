import React from "react";
import XMLDragAndDrop from "@/components/upload/XMLDragAndDrop";
import PageShell from "@/components/layout/PageShell";

export default function UploadPage() {
  return (
    <PageShell
      eyebrow="Carga inteligente"
      title="Cargar XML"
      description="Sube facturas CFDI de ingresos, egresos o nómina para procesarlas y clasificarlas al instante."
    >
      <XMLDragAndDrop />
    </PageShell>
  );
}
