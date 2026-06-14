import FinancialOverview from "@/components/dashboard/FinancialOverview";

export default function Home() {
  return (
    <div className="min-h-full p-4 sm:p-6 md:p-10 lg:p-12 space-y-8 md:space-y-16">
      <section>
        <FinancialOverview />
      </section>
    </div>
  );
}
