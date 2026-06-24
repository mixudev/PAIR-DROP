import type { Metadata } from "next";
import { Header } from "@/components/layouts/header";
import { PairSessionView } from "@/modules/pair-session/components/pair-session-view";

export const metadata: Metadata = {
  title: "Pair Devices",
  description: "Scan QR code to pair two devices instantly",
};

export default function PairPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <PairSessionView />
      </main>
    </div>
  );
}
