"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  User,
  LogIn,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { signOut } from "@/lib/supabase/auth";
import { toast } from "sonner";

export function UserMenu() {
  const { user, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  const handleSignIn = () => {
    router.push("/login");
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.push("/");
      router.refresh();
      toast.success("Berhasil keluar");
    } catch {
      toast.error("Gagal keluar");
    } finally {
      setSigningOut(false);
      setOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
    );
  }

  if (!user) {
    return (
      <Button
        id="login-btn"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleSignIn}
      >
        <LogIn className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Login</span>
      </Button>
    );
  }

  const initials = user.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="relative">
      <button
        id="user-menu-btn"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-card p-1 pr-2 text-sm font-medium transition-colors hover:bg-accent"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Avatar className="h-7 w-7">
          <AvatarImage
            src={user.user_metadata?.avatar_url}
            alt={user.user_metadata?.full_name ?? "User"}
          />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden max-w-[100px] truncate sm:inline text-xs">
          {user.user_metadata?.full_name ?? user.email}
        </span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-border bg-card p-1 shadow-lg">
            {/* User info */}
            <div className="px-3 py-2 border-b border-border mb-1">
              <p className="text-xs font-medium truncate">
                {user.user_metadata?.full_name ?? "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>

            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>

            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
            >
              <User className="h-4 w-4" />
              Profil
            </Link>

            <div className="border-t border-border mt-1 pt-1">
              <button
                id="signout-btn"
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                {signingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Keluar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
