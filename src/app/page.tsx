import { Header } from "@/components/layouts/header";
import { DashboardHero } from "@/modules/dashboard/components/dashboard-hero";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <DashboardHero />
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        PairDrop — Real-time sync across all your devices
      </footer>
    </div>
  );
}
