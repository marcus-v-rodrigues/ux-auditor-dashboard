import Link from "next/link";

import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/sessions/new", label: "Nova Auditoria" },
  { href: "/sessions", label: "Histórico" },
];

export function AppNavbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.28em] text-sky-300">
            UX Auditor
          </p>
          <h1 className="truncate text-sm font-semibold text-white">
            Dashboard
          </h1>
        </div>

        <nav className="flex items-center gap-2">
          {navItems.map((item) => (
            <Button
              key={item.href}
              asChild
              variant="outline"
              className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white"
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
