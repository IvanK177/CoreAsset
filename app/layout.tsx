import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import PWARegister from "@/components/shared/PWARegister";
import ThemeInitializer from "@/components/shared/ThemeInitializer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1e3a5f" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" }
  ]
} as any;

export const metadata: Metadata = {
  title: "CoreAsset — Управление IT-активами",
  description: "Система учёта компьютеров, лицензий и сотрудников",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CoreAsset",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" }
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" }
    ]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="antialiased">
        <ThemeInitializer />
        <PWARegister />
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
