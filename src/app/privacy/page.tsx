import type { Metadata } from "next";
import { Header } from "@/components/layouts/header";
import { APP_NAME } from "@/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="mb-6 text-3xl font-bold">Privacy Policy</h1>
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Your privacy matters. This policy outlines how {APP_NAME} handles
            your data.
          </p>
          <h2 className="text-lg font-semibold text-foreground">What We Collect</h2>
          <p>
            We collect minimal data: device identifiers (for room membership),
            and optionally your Google account info if you choose to log in.
            We do not track your browsing activity or sell your data.
          </p>
          <h2 className="text-lg font-semibold text-foreground">Shared Content</h2>
          <p>
            Files, links, clipboard text, and notes you share within a room
            are stored temporarily on our servers and are automatically deleted
            when the room expires or is removed. Only room participants can
            access this content.
          </p>
          <h2 className="text-lg font-semibold text-foreground">Cookies &amp; Storage</h2>
          <p>
            We use localStorage for client-side settings and room tokens.
            No tracking cookies are used. Authentication is handled securely
            via Supabase.
          </p>
          <h2 className="text-lg font-semibold text-foreground">Contact</h2>
          <p>
            Questions about this policy? Reach out via the{" "}
            <a href="/about" className="text-primary hover:underline">About page</a>.
          </p>
        </div>
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} {APP_NAME} — by mixudev</p>
      </footer>
    </div>
  );
}
