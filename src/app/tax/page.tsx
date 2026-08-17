import PageShell from "@/components/layout/PageShell";
import TaxManager from "@/components/tax/TaxManager";

export default function TaxPage() {
  return (
    <PageShell
      title="Impuestos y Declaración SAT"
      description="Cálculo automático de IVA e ISR estimado según tu régimen fiscal (RESICO, Persona Física o Moral) y verificación de proveedores EFOS."
    >
      <TaxManager />
    </PageShell>
  );
}
