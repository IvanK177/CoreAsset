import type { Metadata } from "next";
import { Onest } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "CoreAsset — Управление IT-активами",
  description: "Система учёта компьютеров, лицензий и сотрудников",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={onest.variable}>
      <body className="antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
