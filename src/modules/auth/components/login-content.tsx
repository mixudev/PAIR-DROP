"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Shield, Globe, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/supabase/auth";
import { toast } from "sonner";
import { APP_NAME } from "@/constants";

const benefits = [
  {
    icon: Shield,
    title: "Simpan Room Kamu",
    description: "Room yang kamu buat tersimpan ke akun — tidak akan hilang meski localStorage terhapus.",
  },
  {
    icon: Globe,
    title: "Akses dari Mana Saja",
    description: "Login di perangkat baru dan semua room kamu langsung tersedia.",
  },
  {
    icon: Zap,
    title: "Dashboard Pribadi",
    description: "Pantau semua room, file, dan aktivitas dalam satu tempat.",
  },
];

// Google logo SVG inline (Chrome icon tidak tersedia di lucide-react)
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export function LoginContent() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const next = searchParams.get("next");

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle(next ?? "/dashboard");
    } catch {
      toast.error("Gagal login dengan Google. Coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Back button */}
      <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
      </div>

      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Logo + Title */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold shadow-lg">
              P
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Login untuk menyimpan room dan mengaksesnya dari perangkat mana pun
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Login gagal. Silakan coba lagi.
            </div>
          )}

          {/* Login Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <Button
              id="google-signin-btn"
              className="w-full gap-3 text-base font-medium h-12"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <GoogleIcon className="h-5 w-5" />
              )}
              {isLoading ? "Mengarahkan..." : "Lanjutkan dengan Google"}
            </Button>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Login bersifat opsional. Kamu tetap bisa membuat dan bergabung
              ke room tanpa login.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * (i + 1) }}
                className="flex items-start gap-3 rounded-xl border border-border bg-card/50 p-4"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <b.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{b.title}</p>
                  <p className="text-xs text-muted-foreground">{b.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Dengan login, kamu menyetujui{" "}
            <span className="underline underline-offset-2 cursor-pointer">Syarat Layanan</span>{" "}
            kami.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
