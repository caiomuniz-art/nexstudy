"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useApplyPageQuery } from "@/lib/client-query";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Logo } from "@/components/logo";
import { StudyArt, type StudyScene } from "@/components/study-art";
import { Alert, Button, Field, TextInput } from "@/components/ui";
import { getSiteUrl } from "@/lib/env";
import { mapAuthError } from "@/lib/errors";
import { browserAccounts } from "@/lib/local-account";
import { SUPABASE_MISSING_MESSAGE } from "@/lib/messages";
import { safeNextPath } from "@/lib/paths";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { loginSchema, recoverySchema, signupSchema } from "@/lib/validations";

export function LoginForm({ nextPath, initialError }: { nextPath?: string; initialError?: string }) {
  const router = useRouter();
  const [error, setError] = useState(initialError ?? "");
  const [next, setNext] = useState(nextPath);
  const [show, setShow] = useState(false);
  useApplyPageQuery((pageQuery) => {
    if (pageQuery.next) setNext(safeNextPath(pageQuery.next));
    const known: Record<string, string> = {
      confirmacao: "Não foi possível confirmar o acesso. Solicite um novo link.",
      configuracao: "Não foi possível concluir o acesso. Tente de novo.",
    };
    const message = known[pageQuery.erro];
    if (message) setError(message);
  });
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "", next: nextPath },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setError("");
    const book = browserAccounts();
    if (!book) {
      setError("Não foi possível abrir a conta neste navegador.");
      return;
    }
    const result = await book.login({ name: values.username, secret: values.password });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(safeNextPath(next));
    router.refresh();
  }

  return (
    <AuthCard scene="calendario" title="Entrar" subtitle="Use os dados da sua conta.">
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Field id="identificacao" error={form.formState.errors.username?.message}>
          <TextInput id="identificacao" autoComplete="username" aria-invalid={Boolean(form.formState.errors.username)} {...form.register("username")} />
        </Field>
        <Field id="acesso" error={form.formState.errors.password?.message}>
          <TextInput id="acesso" type={show ? "text" : "password"} autoComplete="current-password" aria-invalid={Boolean(form.formState.errors.password)} {...form.register("password")} />
        </Field>
        <button type="button" className="text-sm text-accent" onClick={() => setShow((value) => !value)}>
          {show ? "Ocultar" : "Mostrar"}
        </button>
        <Button type="submit" className="w-full" pending={form.formState.isSubmitting}>Entrar</Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        Não tem uma conta? <Link href="/cadastro" className="text-accent">Cadastre-se.</Link>
      </p>
      <Link href="/visitante" className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-medium">
        Continuar como visitante
      </Link>
    </AuthCard>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [show, setShow] = useState(false);
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", password: "", confirmPassword: "", notificationContact: "" },
  });

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    setError("");
    setInfo("");
    const book = browserAccounts();
    if (!book) {
      setError("Não foi possível guardar a conta neste navegador.");
      return;
    }
    const result = await book.register({
      name: values.fullName,
      secret: values.password,
      notificationContact: values.notificationContact ?? "",
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthCard scene="estudo" title="Criar conta" subtitle="A conta fica salva para você entrar depois. Série, turma e escola ficam no perfil.">
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {error ? <Alert tone="error">{error}</Alert> : null}
        {info ? <Alert tone="success">{info}</Alert> : null}
        <Field id="fullName" label="Nome" error={form.formState.errors.fullName?.message}>
          <TextInput id="fullName" autoComplete="name" {...form.register("fullName")} />
        </Field>
        <div className="rounded-xl border border-mark/50 bg-accent-soft p-3">
          <Field id="aviso-contato" label="E-mail para avisos" hint="Opcional. Quer receber avisos? Qualquer texto serve. O cadastro segue mesmo se este campo ficar vazio." error={form.formState.errors.notificationContact?.message}>
            <TextInput id="aviso-contato" autoComplete="off" placeholder="Opcional" aria-describedby="aviso-contato-hint" {...form.register("notificationContact")} />
          </Field>
        </div>
        <Field id="acesso-novo" hint="No mínimo 8 caracteres, com letra e número." error={form.formState.errors.password?.message}>
          <TextInput id="acesso-novo" type={show ? "text" : "password"} autoComplete="new-password" {...form.register("password")} />
        </Field>
        <Field id="acesso-confirma" error={form.formState.errors.confirmPassword?.message}>
          <TextInput id="acesso-confirma" type={show ? "text" : "password"} autoComplete="new-password" {...form.register("confirmPassword")} />
        </Field>
        <button type="button" className="text-sm text-accent" onClick={() => setShow((value) => !value)}>
          {show ? "Ocultar" : "Mostrar"}
        </button>
        <Button type="submit" className="w-full" pending={form.formState.isSubmitting}>Criar conta</Button>
      </form>
      <p className="mt-4 text-sm text-muted">Já tem uma conta? <Link href="/login" className="text-accent">Entrar</Link></p>
    </AuthCard>
  );
}

export function RecoveryForm() {
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const form = useForm<z.infer<typeof recoverySchema>>({
    resolver: zodResolver(recoverySchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof recoverySchema>) {
    setError("");
    setInfo("");
    const supabase = createBrowserSupabase();
    if (!supabase) {
      setError(SUPABASE_MISSING_MESSAGE);
      return;
    }
    const next = encodeURIComponent("/configuracoes?recuperacao=1");
    const { error: authError } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=${next}`,
    });
    if (authError && /fetch|network/i.test(authError.message)) {
      setError(mapAuthError(authError.message));
      return;
    }
    setInfo("Se existir uma conta com este e-mail, enviaremos instruções para redefinir a senha.");
  }

  return (
    <AuthCard scene="horario" title="Recuperar senha" subtitle="Enviaremos um link se a conta existir.">
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {error ? <Alert tone="error">{error}</Alert> : null}
        {info ? <Alert tone="success">{info}</Alert> : null}
        <Field id="email" label="E-mail" error={form.formState.errors.email?.message}>
          <TextInput id="email" type="email" autoComplete="email" {...form.register("email")} />
        </Field>
        <Button type="submit" className="w-full" pending={form.formState.isSubmitting}>Enviar instruções</Button>
      </form>
      <p className="mt-4 text-sm text-muted"><Link href="/login" className="text-accent">Voltar ao login</Link></p>
    </AuthCard>
  );
}

function AuthCard({ scene, title, subtitle, children }: { scene: StudyScene; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main id="conteudo" className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="oe-card mx-auto mb-6 w-full max-w-64 overflow-hidden">
        <StudyArt scene={scene} />
      </div>
      <div className="oe-card oe-pad rise">
        <Logo />
        <h1 className="oe-section mt-6">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
