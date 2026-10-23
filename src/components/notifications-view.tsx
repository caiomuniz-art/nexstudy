"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import Link from "next/link";

import { Alert, Button, EmptyState, PageHeader } from "@/components/ui";
import { formatDateTimeBr } from "@/lib/dates";
import { NOTIFICATION_LABEL } from "@/lib/labels";
import { noticesFromBook } from "@/lib/local-workspace";
import { useLocalAccount } from "@/lib/use-local-account";
import { useLocalBook } from "@/lib/use-local-book";
import { notificationPreferencesSchema } from "@/lib/validations";
import { markAllNotificationsRead, markNotificationRead, updateNotificationPreferences } from "@/server/actions";
import type { NotificationPreferencesRow, NotificationRow } from "@/types/domain";

export function NotificationsView({
  notifications: serverNotifications,
  preferences: serverPreferences,
  dbMessage,
}: {
  notifications: NotificationRow[];
  preferences: NotificationPreferencesRow | null;
  dbMessage: string | null;
}) {
  const stored = useLocalBook();
  const notifications = stored ? noticesFromBook(stored) : serverNotifications;
  const preferences = stored ? stored.notificationPreferences : serverPreferences;
  const router = useRouter();
  const account = useLocalAccount();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"todas" | "nao_lidas">("todas");
  const visible = notifications.filter((item) => filter === "todas" || !item.read_at);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title="Notificações" description="Avisos internos calculados a partir das suas tarefas, provas, trabalhos e sessões." actions={<Button type="button" variant="secondary" onClick={async () => { const result = await markAllNotificationsRead(); if (!result.ok) setError(result.error); else { setMessage(result.message); router.refresh(); } }}>Marcar todas como lidas</Button>} />
      {dbMessage ? <Alert tone="error">{dbMessage}</Alert> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      <section className="oe-card oe-pad">
        <h2 className="font-semibold">E-mail para avisos</h2>
        {account ? (
          <p className="mt-2 text-sm text-muted">
            {account.notificationContact
              ? <>O e-mail guardado nesta conta é: <span className="font-medium text-foreground">{account.notificationContact}</span>.</>
              : "Nenhum e-mail para avisos foi informado."}
            {" "}Para incluir ou mudar, use <Link href="/configuracoes" className="text-accent">Configurações</Link>. Nenhum e-mail é enviado.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">Entre na sua conta para guardar um e-mail para avisos. O campo fica em <Link href="/configuracoes" className="text-accent">Configurações</Link> e também no cadastro.</p>
        )}
      </section>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={filter === "todas" ? "primary" : "secondary"} onClick={() => setFilter("todas")}>Todas</Button>
        <Button type="button" variant={filter === "nao_lidas" ? "primary" : "secondary"} onClick={() => setFilter("nao_lidas")}>Não lidas</Button>
      </div>
      {notifications.length === 0 ? <EmptyState title="Nenhum aviso no momento" description="Quando houver prazo próximo, tarefa atrasada, prova futura, trabalho pendente ou sessão agendada, o aviso aparece aqui." /> : visible.length === 0 ? <EmptyState title="Nenhum aviso não lido" description="Os avisos já lidos continuam na lista completa." action={<Button type="button" variant="secondary" onClick={() => setFilter("todas")}>Ver todas</Button>} /> : (
        <ul className="space-y-3">
          {visible.map((item) => (
            <li key={item.id} className="oe-card oe-pad">
              <p className="text-xs text-muted">{NOTIFICATION_LABEL[item.type]} · {formatDateTimeBr(item.created_at)}{item.read_at ? " · lida" : ""}</p>
              <h2 className="mt-1 font-semibold">{item.title}</h2>
              <p className="mt-1 text-sm">{item.message}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {!item.read_at ? <Button type="button" size="sm" variant="secondary" onClick={async () => { const result = await markNotificationRead(item.id); if (!result.ok) setError(result.error); else { setMessage(result.message); router.refresh(); } }}>Marcar como lida</Button> : null}
                {item.href ? <Button type="button" size="sm" onClick={async () => { if (!item.read_at) await markNotificationRead(item.id); router.push(item.href || "/notificacoes"); router.refresh(); }}>Ver detalhes</Button> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      <NoticePrefs
        key={preferences?.updated_at ?? "padrao"}
        preferences={preferences}
        onSaved={(text) => { setMessage(text); setError(""); router.refresh(); }}
        onError={setError}
      />
    </div>
  );
}

function NoticePrefs({
  preferences,
  onSaved,
  onError,
}: {
  preferences: NotificationPreferencesRow | null;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const form = useForm<z.infer<typeof notificationPreferencesSchema>>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      deadlines_enabled: preferences?.deadlines_enabled ?? true,
      overdue_enabled: preferences?.overdue_enabled ?? true,
      exams_enabled: preferences?.exams_enabled ?? true,
      assignments_enabled: preferences?.assignments_enabled ?? true,
      sessions_enabled: preferences?.sessions_enabled ?? true,
      email_opt_in: preferences?.email_opt_in ?? false,
    },
  });

  return (
    <form className="oe-card oe-pad space-y-3" onSubmit={form.handleSubmit(async (values) => {
      const result = await updateNotificationPreferences(values);
      if (!result.ok) onError(result.error);
      else onSaved(result.message);
    })}>
      <h2 className="font-semibold">Preferências</h2>
      <p className="text-sm text-muted">Escolha quais avisos aparecem nesta página.</p>
      <Preference name="deadlines_enabled" label="Prazos próximos" form={form} />
      <Preference name="overdue_enabled" label="Tarefas atrasadas" form={form} />
      <Preference name="exams_enabled" label="Provas futuras" form={form} />
      <Preference name="assignments_enabled" label="Trabalhos pendentes" form={form} />
      <Preference name="sessions_enabled" label="Sessões agendadas" form={form} />
      <Preference name="email_opt_in" label="Avisos por e-mail" form={form} />
      <Button type="submit" pending={form.formState.isSubmitting}>Salvar preferências</Button>
    </form>
  );
}

function Preference({ name, label, form }: { name: keyof z.infer<typeof notificationPreferencesSchema>; label: string; form: ReturnType<typeof useForm<z.infer<typeof notificationPreferencesSchema>>> }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" {...form.register(name)} />
      {label}
    </label>
  );
}
