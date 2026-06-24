import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "sonner";
import { DeviceProvider } from "@/providers/device-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { APP_DESCRIPTION, APP_NAME } from "@/constants";
import "./globals.css";

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "file sharing",
    "clipboard sync",
    "real-time sync",
    "cross-device",
    "QR pairing",
  ],
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <DeviceProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: "rounded-md border border-border bg-card text-card-foreground shadow-sm",
              }}
            />
          </DeviceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
