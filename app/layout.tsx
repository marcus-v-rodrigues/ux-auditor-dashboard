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
        <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.10),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.08),_transparent_22%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(15,23,42,0.98))] pt-16 text-foreground">
          {children}
        </main>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
