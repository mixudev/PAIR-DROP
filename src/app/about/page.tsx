import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layouts/header";
import { APP_NAME } from "@/constants";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6 text-center">
        <div className="mb-8 mx-auto">
          <Image
            src="/icons/icon.png"
            alt={APP_NAME}
            width={64}
            height={64}
            priority
            className="rounded-2xl shadow-lg"
          />
        </div>
        <h1 className="mb-2 text-3xl font-bold">{APP_NAME}</h1>
        <p className="mb-8 text-muted-foreground">
          Real-time file, link, text &amp; clipboard sync across all your devices.
        </p>

        <div className="rounded-xl border border-border bg-card p-6 text-left space-y-4">
          <h2 className="text-lg font-semibold">Developer</h2>
          <div className="flex items-center gap-4">
            <Image
                src="https://github.com/mixudev.png?size=200"
                alt="Lazuardi Mandegar"
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
            <div>
              <p className="font-medium">Lazuardi Mandegar</p>
              <a
                href="https://github.com/mixudev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                github.com/mixudev
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2">
            Privacy Policy
          </Link>
        </div>
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} {APP_NAME} — by mixudev</p>
      </footer>
    </div>
  );
}
