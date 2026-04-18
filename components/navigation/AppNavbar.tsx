import Link from "next/link";

import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/sessions/new", label: "Nova Auditoria" },
  { href: "/sessions", label: "Histórico" },
];

export function AppNavbar() {
  return (
    <header className="app-nav fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <div className="min-w-0">
          <p className="app-eyebrow text-[10px]">
            UX Auditor
          </p>
          <h1 className="app-heading truncate text-sm font-semibold">
            Dashboard
          </h1>
        </div>

        <nav className="flex items-center gap-2">
          {navItems.map((item) => (
            <Button
              key={item.href}
              asChild
              variant="outline"
              className="app-outline-action hover:app-outline-action-hover"
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
