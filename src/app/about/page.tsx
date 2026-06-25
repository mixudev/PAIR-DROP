import type { Metadata } from "next";
import Link from "next/link";
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
        <div className="mb-8 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
            <path d="M4 20h16" />
            <path d="M4 20V4" />
            <path d="M4 8h12" />
            <path d="M4 12h8" />
            <path d="M4 16h4" />
          </svg>
        </div>
        <h1 className="mb-2 text-3xl font-bold">{APP_NAME}</h1>
        <p className="mb-8 text-muted-foreground">
          Real-time file, link, text &amp; clipboard sync across all your devices.
        </p>

        <div className="rounded-xl border border-border bg-card p-6 text-left space-y-4">
          <h2 className="text-lg font-semibold">Developer</h2>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              LM
            </div>
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
