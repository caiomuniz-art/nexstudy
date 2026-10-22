"use client";

import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  Library,
  ListChecks,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Plus,
  Settings,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/logo";
import { logout, markNotificationRead, updatePreferences } from "@/server/actions";
import type { ShellInfo } from "@/server/data";
import { PRIVATE_ROUTES, type Theme } from "@/types/domain";
import { cn } from "@/lib/text";

const ICONS = {
  "/dashboard": LayoutDashboard,
  "/tarefas": ListChecks,
  "/avaliacoes": GraduationCap,
  "/horarios": Clock3,
  "/calendario": CalendarDays,
  "/estudos": BookOpen,
  "/materias": Library,
  "/relatorios": BarChart3,
  "/notificacoes": Bell,
  "/perfil": UserRound,
  "/configuracoes": Settings,
} as const;

function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.dataset.theme = theme;
}

export function AppShell({ shell, children }: { shell: ShellInfo; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [quick, setQuick] = useState(false);
  const [notices, setNotices] = useState(false);
  const [account, setAccount] = useState(false);
  const [theme, setTheme] = useState<Theme>(shell.theme);
  const [themeSource, setThemeSource] = useState(shell.theme);
  const [menuPath, setMenuPath] = useState(pathname);
  const [notice, setNotice] = useState<string | null>(null);

  if (themeSource !== shell.theme) {
    setThemeSource(shell.theme);
    setTheme(shell.theme);
  }
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
    setQuick(false);
    setNotices(false);
    setAccount(false);
  }

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("oe-theme", theme);
  }, [theme]);

  async function signOut(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await logout();
    router.push("/");
  }

  async function cycleTheme() {
    const order: Theme[] = ["light", "dark", "system"];
    const next = order[(order.indexOf(theme) + 1) % order.length] ?? "system";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("oe-theme", next);
    if (!shell.configured) {
      setNotice("Tema atualizado neste navegador.");
      return;
    }
    const result = await updatePreferences({ theme: next, tasks_view: shell.tasksView, density: shell.density });
    setNotice(result.ok ? "Tema atualizado." : result.error);
    if (result.ok) router.refresh();
  }

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const displayName = shell.fullName || (shell.configured ? "Estudante" : "Visitante");

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]" data-density={shell.density}>
      <aside className={cn("fixed inset-y-0 left-0 z-40 w-[min(16.25rem,85vw)] max-w-[85vw] bg-sidebar text-white transition-transform lg:static lg:w-[260px] lg:max-w-none", open ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-4">
            <Link href="/dashboard" className="text-white" onClick={() => setOpen(false)}>
              <Logo />
            </Link>
            <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-lg lg:hidden" aria-label="Fechar menu" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Seções">
            {PRIVATE_ROUTES.map((route) => {
              const Icon = ICONS[route.href];
              const active = pathname === route.href;
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm tracking-tight text-sidebar-muted shadow-[inset_3px_0_0_transparent] transition",
                    active
                      ? "bg-white/10 font-semibold text-white shadow-[inset_3px_0_0_var(--mark)]"
                      : "hover:bg-white/8 hover:text-white hover:shadow-[inset_3px_0_0_var(--mark)]",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {route.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-white/10 p-3">
            {shell.configured ? (
              <form onSubmit={signOut}>
                <button type="submit" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-muted shadow-[inset_3px_0_0_transparent] transition hover:bg-white/8 hover:text-white hover:shadow-[inset_3px_0_0_var(--mark)]">
                  <LogOut className="h-4 w-4" aria-hidden />
                  Sair
                </button>
              </form>
            ) : (
              <Link href="/login" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-muted shadow-[inset_3px_0_0_transparent] transition hover:bg-white/8 hover:text-white hover:shadow-[inset_3px_0_0_var(--mark)]">
                Entrar
              </Link>
            )}
          </div>
        </div>
      </aside>
      {open ? <button type="button" className="fixed inset-0 z-30 bg-sidebar/40 lg:hidden" aria-label="Fechar menu" onClick={() => setOpen(false)} /> : null}
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex min-w-0 items-center gap-2 border-b border-border bg-card/90 px-3 py-2 backdrop-blur sm:px-4">
          <button type="button" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-accent-soft lg:hidden" aria-label="Abrir menu" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <p className="hidden min-w-0 truncate text-sm text-muted sm:block sm:max-w-[10rem] md:max-w-xs">{displayName}</p>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <div className="relative">
              <button type="button" className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm hover:bg-accent-soft" aria-expanded={quick} onClick={() => { setQuick((value) => !value); setNotices(false); setAccount(false); }}>
                <Plus className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Adicionar</span>
              </button>
              {quick ? (
                <div className="oe-card absolute right-0 z-30 mt-2 w-[min(14rem,calc(100vw-1.5rem))] p-2 text-sm">
                  <Link className="block min-h-11 rounded-lg px-3 py-2 hover:bg-accent-soft" href="/tarefas?nova=1">Nova tarefa</Link>
                  <Link className="block min-h-11 rounded-lg px-3 py-2 hover:bg-accent-soft" href="/avaliacoes?nova=1">Nova prova ou trabalho</Link>
                  <Link className="block min-h-11 rounded-lg px-3 py-2 hover:bg-accent-soft" href="/estudos?nova=1">Nova sessão de estudo</Link>
                  <Link className="block min-h-11 rounded-lg px-3 py-2 hover:bg-accent-soft" href="/materias?nova=1">Nova matéria</Link>
                </div>
              ) : null}
            </div>
            <div className="relative">
              <button type="button" className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl hover:bg-accent-soft" aria-label="Notificações" aria-expanded={notices} onClick={() => { setNotices((value) => !value); setQuick(false); setAccount(false); }}>
                <Bell className="h-5 w-5" />
                {shell.configured && shell.unreadCount > 0 ? (
                  <span className="absolute right-1 top-1 inline-flex min-w-4 justify-center rounded-full bg-cyan px-1 text-[10px] font-semibold text-cyan-ink">{shell.unreadCount}</span>
                ) : null}
              </button>
              {notices ? (
                <div className="oe-card absolute right-0 z-30 mt-2 w-[min(20rem,calc(100vw-1.5rem))] p-3 text-sm">
                  {!shell.configured ? <p>Entre na sua conta para ver os avisos.</p> : shell.recent.length === 0 ? <p>Nenhum aviso não lido.</p> : (
                    <ul className="space-y-2">
                      {shell.recent.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            className="w-full rounded-lg px-2 py-1 text-left hover:bg-accent-soft"
                            onClick={async () => {
                              await markNotificationRead(item.id);
                              if (item.href) router.push(item.href);
                              else router.refresh();
                            }}
                          >
                            {item.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link href="/notificacoes" className="mt-3 inline-flex text-accent">Ver todas</Link>
                </div>
              ) : null}
            </div>
            <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-xl hover:bg-accent-soft" aria-label={`Tema: ${theme === "light" ? "claro" : theme === "dark" ? "escuro" : "sistema"}`} onClick={cycleTheme}>
              <ThemeIcon className="h-5 w-5" />
            </button>
            <div className="relative">
              <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-xl hover:bg-accent-soft" aria-label="Conta" aria-expanded={account} onClick={() => { setAccount((value) => !value); setQuick(false); setNotices(false); }}>
                <UserRound className="h-5 w-5" />
              </button>
              {account ? (
                <div className="oe-card absolute right-0 z-30 mt-2 w-[min(16rem,calc(100vw-1.5rem))] p-2 text-sm">
                  <p className="break-all px-3 py-2 text-muted">{shell.email || shell.fullName || "Sem sessão"}</p>
                  <Link className="block rounded-lg px-3 py-2 hover:bg-accent-soft" href="/perfil">Perfil</Link>
                  <Link className="block rounded-lg px-3 py-2 hover:bg-accent-soft" href="/configuracoes">Configurações</Link>
                  {shell.configured ? (
                    <form onSubmit={signOut}>
                      <button type="submit" className="w-full rounded-lg px-3 py-2 text-left hover:bg-accent-soft">Sair</button>
                    </form>
                  ) : <Link className="block rounded-lg px-3 py-2 hover:bg-accent-soft" href="/login">Entrar</Link>}
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main id="conteudo" className="min-w-0 px-4 py-6 sm:px-6">
          {notice ? <p role="status" className="mb-4 text-sm text-muted">{notice}</p> : null}
          {shell.dbMessage ? <p role="alert" className="mb-4 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm">{shell.dbMessage}</p> : null}
          {children}
        </main>
      </div>
    </div>
  );
}
