"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useApplyPageQuery } from "@/lib/client-query";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Alert, Button, Field, PageHeader, SelectInput, TextInput } from "@/components/ui";
import { mapAuthError } from "@/lib/errors";
import { browserAccounts } from "@/lib/local-account";
import { useLocalAccount } from "@/lib/use-local-account";
import { SUPABASE_MISSING_MESSAGE } from "@/lib/messages";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { deleteAccountSchema, passwordChangeSchema, preferencesSchema } from "@/lib/validations";
import { deleteOwnAccount, updatePreferences } from "@/server/actions";
import { DENSITIES, TASK_VIEWS, THEMES, type Density, type TaskView, type Theme } from "@/types/domain";

export function SettingsView({
  configured,
  theme,
  tasksView,
  density,
  recovery,
  dbMessage,
}: {
  configured: boolean;
  theme: Theme;
  tasksView: TaskView;
  density: Density;
  recovery: boolean;
  dbMessage: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState(recovery ? "Senha pronta para ser redefinida. Escolha uma nova senha abaixo." : "");
  const [error, setError] = useState("");
  const account = useLocalAccount();
  const [contactDraft, setContactDraft] = useState<string | null>(null);
  const contact = contactDraft ?? account?.notificationContact ?? "";
  useApplyPageQuery((pageQuery) => {
    if (pageQuery.recuperacao) setMessage("Senha pronta para ser redefinida. Escolha uma nova senha abaixo.");
  });
  const preferences = useForm<z.infer<typeof preferencesSchema>>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: { theme, tasks_view: tasksView, density },
  });
  const password = useForm<z.infer<typeof passwordChangeSchema>>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const deletion = useForm<z.infer<typeof deleteAccountSchema>>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { confirmation: "" },
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader title="Configurações" description="Tema, exibição, senha e exclusão da conta." />
      {dbMessage ? <Alert tone="error">{dbMessage}</Alert> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <form className="oe-card oe-pad grid gap-3" onSubmit={preferences.handleSubmit(async (values) => {
        localStorage.setItem("oe-theme", values.theme);
        localStorage.setItem("oe-tasks-view", values.tasks_view);
        localStorage.setItem("oe-density", values.density);
        const dark = values.theme === "dark" || (values.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
        document.documentElement.classList.toggle("dark", dark);
        if (!configured) {
          setMessage("Preferências salvas neste navegador.");
          return;
        }
        const result = await updatePreferences(values);
        if (!result.ok) setError(result.error);
        else { setMessage(result.message); setError(""); router.refresh(); }
      })}>
        <h2 className="font-semibold">Exibição</h2>
        <Field id="tema" label="Tema">
          <SelectInput id="tema" {...preferences.register("theme")}>
            {THEMES.map((item) => <option key={item} value={item}>{item === "light" ? "Claro" : item === "dark" ? "Escuro" : "Sistema"}</option>)}
          </SelectInput>
        </Field>
        <Field id="visao" label="Tarefas">
          <SelectInput id="visao" {...preferences.register("tasks_view")}>
            {TASK_VIEWS.map((item) => <option key={item} value={item}>{item === "lista" ? "Lista" : "Cartões"}</option>)}
          </SelectInput>
        </Field>
        <Field id="densidade" label="Densidade">
          <SelectInput id="densidade" {...preferences.register("density")}>
            {DENSITIES.map((item) => <option key={item} value={item}>{item === "confortavel" ? "Confortável" : "Compacta"}</option>)}
          </SelectInput>
        </Field>
        <Button type="submit" pending={preferences.formState.isSubmitting}>Salvar exibição</Button>
      </form>

      {account ? (
        <form className="oe-card oe-pad grid gap-3" onSubmit={(event) => {
          event.preventDefault();
          const book = browserAccounts();
          if (!book) {
            setError("Não foi possível guardar neste navegador.");
            return;
          }
          const result = book.saveContact(contact);
          if (!result.ok) setError(result.error);
          else {
            setContactDraft(null);
            setMessage("Contato salvo neste navegador.");
            setError("");
          }
        }}>
          <h2 className="font-semibold">Avisos</h2>
          <p className="text-sm text-muted">Opcional. Qualquer texto serve, e nada é conferido. Fica guardado com a conta neste navegador.</p>
          <Field id="aviso-contato" label="E-mail para avisos">
            <TextInput id="aviso-contato" autoComplete="off" value={contact} onChange={(event) => setContactDraft(event.target.value)} />
          </Field>
          <Button type="submit">Salvar contato</Button>
        </form>
      ) : null}

      <form className="oe-card oe-pad grid gap-3" onSubmit={password.handleSubmit(async (values) => {
        const supabase = createBrowserSupabase();
        if (!supabase) { setError(SUPABASE_MISSING_MESSAGE); return; }
        const { error: authError } = await supabase.auth.updateUser({ password: values.password });
        if (authError) { setError(mapAuthError(authError.message)); return; }
        password.reset();
        setMessage("Senha alterada.");
        setError("");
      })} noValidate>
        <h2 className="font-semibold">Trocar senha</h2>
        <p className="text-sm text-muted">A troca usa a sessão atual. Se for pedida uma autenticação recente, entre de novo ou <Link href="/recuperar-senha" className="text-accent">peça um link</Link>.</p>
        <Field id="nova-senha" label="Nova senha" error={password.formState.errors.password?.message}><TextInput id="nova-senha" type="password" autoComplete="new-password" {...password.register("password")} /></Field>
        <Field id="confirma-senha" label="Confirmar senha" error={password.formState.errors.confirmPassword?.message}><TextInput id="confirma-senha" type="password" autoComplete="new-password" {...password.register("confirmPassword")} /></Field>
        <Button type="submit" pending={password.formState.isSubmitting}>Atualizar senha</Button>
      </form>

      <form className="oe-card oe-pad grid gap-3 border-danger/40" onSubmit={deletion.handleSubmit(async (values) => {
        const book = browserAccounts();
        if (book?.current()) {
          book.removeCurrent();
          router.push("/");
          return;
        }
        const result = await deleteOwnAccount(values);
        if (!result.ok) setError(result.error);
        else router.push("/");
      })} noValidate>
        <h2 className="font-semibold">Excluir conta e dados</h2>
        <p className="text-sm text-muted">Digite EXCLUIR para confirmar. A exclusão roda no servidor, remove a conta e os registros ligados a ela, e encerra a sessão.</p>
        <Field id="confirmacao" label="Confirmação" error={deletion.formState.errors.confirmation?.message}><TextInput id="confirmacao" autoComplete="off" {...deletion.register("confirmation")} /></Field>
        <Button type="submit" variant="danger" pending={deletion.formState.isSubmitting}>Excluir minha conta</Button>
      </form>
    </div>
  );
}
