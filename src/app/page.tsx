import FinancialOverview from "@/components/dashboard/FinancialOverview";

export default function Home() {
  return (
    <div className="min-h-full p-6 md:p-10 lg:p-12 space-y-16">
      <section>
        <FinancialOverview />
      </section>
    </div>
  );
}
