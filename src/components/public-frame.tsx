"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/text";

const LINKS = [
  { href: "/#funcionalidades", label: "Funcionalidades" },
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#faq", label: "Perguntas" },
  { href: "/privacidade", label: "Privacidade" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState(pathname);
  if (path !== pathname) {
    setPath(pathname);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <Link href="/" className="mr-auto flex min-w-0" onClick={() => setOpen(false)}>
          <Logo size={32} />
        </Link>
        <nav className="hidden items-center gap-5 lg:flex" aria-label="Página inicial">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className="oe-navlink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link href="/login" aria-current={pathname === "/login" ? "page" : undefined} className="oe-navlink shrink-0 text-sm">
          Entrar
        </Link>
        <Link
          href="/cadastro"
          aria-current={pathname === "/cadastro" ? "page" : undefined}
          className={cn("oe-btn oe-header-cta shrink-0", pathname === "/cadastro" && "ring-2 ring-mark ring-offset-2 ring-offset-card")}
        >
          Criar conta
        </Link>
        <button
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-accent-soft lg:hidden"
          aria-expanded={open}
          aria-controls="menu-publico"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open ? (
        <nav id="menu-publico" className="flex flex-col border-t border-border px-3 py-2 lg:hidden" aria-label="Página inicial">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className="oe-navlink w-full min-h-11"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted">Projeto para organizar a rotina escolar: tarefas, provas, grade, estudos e prazos em uma conta individual.</p>
        </div>
        <div className="text-sm">
          <p className="oe-label">Acesso</p>
          <ul className="mt-3 space-y-2 text-muted">
            <li><Link href="/login" className="underline decoration-transparent underline-offset-4 hover:decoration-mark">Entrar</Link></li>
            <li><Link href="/cadastro" className="underline decoration-transparent underline-offset-4 hover:decoration-mark">Criar conta</Link></li>
            <li><Link href="/recuperar-senha" className="underline decoration-transparent underline-offset-4 hover:decoration-mark">Recuperar senha</Link></li>
          </ul>
        </div>
        <div className="text-sm sm:col-span-2 lg:col-span-1">
          <p className="oe-label">Projeto</p>
          <ul className="mt-3 space-y-2 text-muted">
            <li><Link href="/privacidade" className="underline decoration-transparent underline-offset-4 hover:decoration-mark">Política de privacidade</Link></li>
            <li>Interface em português do Brasil</li>
            <li>Fuso America/Sao_Paulo</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
