"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/shared/theme-toggle";
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
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            L
          </div>
          <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
        </Link>

        {showNav && (
          <nav className="hidden items-center gap-6 md:flex">
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
              Create Room
            </Link>
            <Link
              href="/room/join"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Join Room
            </Link>
          </nav>
        )}

        <ThemeToggle />
      </div>
    </header>
  );
}
