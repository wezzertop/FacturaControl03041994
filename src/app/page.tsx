import FinancialOverview from "@/components/dashboard/FinancialOverview";
import XMLDragAndDrop from "@/components/upload/XMLDragAndDrop";
import SATConnectionCards from "@/components/settings/SATConnectionCards";

export default function Home() {
  return (
    <div className="min-h-full p-6 md:p-10 lg:p-12 space-y-16">
      <section>
        <FinancialOverview />
      </section>

      <div className="h-px bg-gray-200 dark:bg-zinc-800 w-full" />

      <section>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-brand-carbon dark:text-brand-white tracking-tight">Carga de Facturas (Manual)</h2>
          <p className="text-sm text-brand-graphite dark:text-brand-smoke mt-1">Sube tus archivos XML directamente.</p>
        </div>
        <XMLDragAndDrop />
      </section>

      <div className="h-px bg-gray-200 dark:bg-zinc-800 w-full" />

      <section>
        <SATConnectionCards />
      </section>
    </div>
  );
}
