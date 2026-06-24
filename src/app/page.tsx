import FinancialOverview from "@/components/dashboard/FinancialOverview";
import LandingPage from "@/components/landing/LandingPage";
import PageShell from "@/components/layout/PageShell";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return (
      <PageShell
        eyebrow="FacturaControl"
        title="Tu centro de control financiero"
        description="Revisa tus facturas, carteras y movimientos en un solo panel listo para decisiones rápidas."
      >
        <FinancialOverview />
      </PageShell>
    );
  }

  return <LandingPage />;
}
