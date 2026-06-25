import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginContent } from "@/modules/auth/components/login-content";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to PairDrop to save your rooms and access them from any device.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-md border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
