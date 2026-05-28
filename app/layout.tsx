import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import PWARegister from "@/components/shared/PWARegister";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const viewport: Viewport = {
  themeColor: "#1e3a5f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "CoreAsset — Управление IT-активами",
  description: "Система учёта компьютеров, лицензий и сотрудников",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CoreAsset",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="antialiased">
        <PWARegister />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
