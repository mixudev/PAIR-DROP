"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/shared/user-menu";
import { InstallPWAButton } from "@/components/shared/install-pwa-button";
import { APP_NAME } from "@/constants";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
  showNav?: boolean;
}

export function Header({ className, showNav = true }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M4 20h16" />
              <path d="M4 20V4" />
              <path d="M4 8h12" />
              <path d="M4 12h8" />
              <path d="M4 16h4" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Nav + Actions */}
        <div className="flex items-center gap-4">
          {showNav && (
            <nav className="hidden items-center gap-4 md:flex">
              <Link
                href="/pair"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Pair
              </Link>
              <Link
                href="/room/create"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Buat Room
              </Link>
              <Link
                href="/room/join"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Gabung Room
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
            </nav>
          )}
          <InstallPWAButton />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
