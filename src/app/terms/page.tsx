import type { Metadata } from "next";
import { Header } from "@/components/layouts/header";
import { APP_NAME } from "@/constants";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="mb-6 text-3xl font-bold">Terms of Service</h1>
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            By using {APP_NAME}, you agree to these terms. {APP_NAME} is a real-time
            file and clipboard sharing platform provided as-is.
          </p>
          <h2 className="text-lg font-semibold text-foreground">1. Use of Service</h2>
          <p>
            You may use {APP_NAME} for lawful purposes only. You agree not to
            transmit any content that is illegal, harmful, or violates the rights
            of others.
          </p>
          <h2 className="text-lg font-semibold text-foreground">2. Data &amp; Privacy</h2>
          <p>
            Files and clipboard data are encrypted in transit. We do not access
            or store your shared content beyond what is necessary to facilitate
            real-time syncing between your devices. See our{" "}
            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
          </p>
          <h2 className="text-lg font-semibold text-foreground">3. No Warranty</h2>
          <p>
            {APP_NAME} is provided without any warranty. We are not responsible
            for data loss, service interruptions, or any damages arising from
            the use of this service.
          </p>
          <h2 className="text-lg font-semibold text-foreground">4. Changes</h2>
          <p>
            We reserve the right to update these terms at any time. Continued
            use of the service after changes constitutes acceptance.
          </p>
        </div>
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} {APP_NAME} — by mixudev</p>
      </footer>
    </div>
  );
}
