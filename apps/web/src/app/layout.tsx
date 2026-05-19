import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "CoreAsset — ITAM System",
  description: "Comprehensive IT Asset Management system for tracking workplaces, hardware, and software licenses",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <div className="min-h-screen bg-[var(--background)]">
            <nav className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4">
              <div className="flex items-center justify-between">
                <a href="/" className="text-xl font-bold text-[var(--primary)]">
                  CoreAsset
                </a>
                <div className="flex gap-6">
                  <a href="/" className="text-[var(--foreground)] hover:text-[var(--primary)]">
                    Dashboard
                  </a>
                  <a href="/hardware" className="text-[var(--foreground)] hover:text-[var(--primary)]">
                    Hardware
                  </a>
                  <a href="/users" className="text-[var(--foreground)] hover:text-[var(--primary)]">
                    Users
                  </a>
                  <a href="/workplaces" className="text-[var(--foreground)] hover:text-[var(--primary)]">
                    Workplaces
                  </a>
                  <a href="/licenses" className="text-[var(--foreground)] hover:text-[var(--primary)]">
                    Licenses
                  </a>
                </div>
              </div>
            </nav>
            <main className="mx-auto max-w-7xl px-6 py-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}