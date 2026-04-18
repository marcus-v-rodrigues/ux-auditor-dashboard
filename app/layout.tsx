import type { Metadata } from "next";
import { Toaster } from "sonner";

import { AppNavbar } from "@/components/navigation/AppNavbar";

import "./globals.css";

export const metadata: Metadata = {
  title: "UX Auditor Dashboard",
  description: "Painel para análise de sessões do UX Auditor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <AppNavbar />
        <main className="app-shell min-h-screen pt-16 text-foreground">
          {children}
        </main>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
