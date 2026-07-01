import FinancialOverview from "@/components/dashboard/FinancialOverview";
import LandingPage from "@/components/landing/LandingPage";
import PageShell from "@/components/layout/PageShell";
import OnboardingWizard from "@/components/dashboard/OnboardingWizard";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Verificar si el usuario tiene carteras. Si no tiene, mostrar el OnboardingWizard.
    const { data: wallets } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    const hasWallets = wallets && wallets.length > 0;

    return (
      <PageShell
        eyebrow="FacturaControl"
        title="Tu centro de control financiero"
        description="Revisa tus facturas, carteras y movimientos en un solo panel listo para decisiones rápidas."
      >
        {hasWallets ? <FinancialOverview /> : <OnboardingWizard />}
      </PageShell>
    );
  }

  return <LandingPage />;
}
