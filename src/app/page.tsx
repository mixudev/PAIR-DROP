"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layouts/header";
import { DashboardHero } from "@/modules/dashboard/components/dashboard-hero";
import { useAuth } from "@/providers/auth-provider";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1" />
      </div>
    );
  }

  if (user) return null;

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
