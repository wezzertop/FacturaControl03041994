import FinancialOverview from "@/components/dashboard/FinancialOverview";
import LandingPage from "@/components/landing/LandingPage";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return (
      <div className="min-h-full p-4 sm:p-6 md:p-10 lg:p-12 space-y-8 md:space-y-16">
        <section>
          <FinancialOverview />
        </section>
      </div>
    );
  }

  return <LandingPage />;
}
