"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layouts/header";
import { DashboardHero } from "@/modules/dashboard/components/dashboard-hero";
import { useAuth } from "@/providers/auth-provider";
import { APP_NAME } from "@/constants";

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
        <nav className="mb-2 flex justify-center gap-4">
          <Link href="/terms" className="hover:text-foreground underline underline-offset-2">Terms</Link>
          <Link href="/privacy" className="hover:text-foreground underline underline-offset-2">Privacy</Link>
          <Link href="/about" className="hover:text-foreground underline underline-offset-2">About</Link>
        </nav>
        <p>&copy; {new Date().getFullYear()} {APP_NAME} — by mixudev</p>
      </footer>
    </div>
  );
}
