"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/logo";
import { Alert, Button, Field, TextInput } from "@/components/ui";
import { safeNextPath } from "@/lib/paths";
import { saveNotificationContact } from "@/server/actions";

export function NoticeEmailForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const next = safeNextPath(nextPath);
  const ahead = `/apresentacao?next=${encodeURIComponent(next)}`;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    const result = await saveNotificationContact({ contact });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(ahead);
    router.refresh();
  }

  return (
    <main id="conteudo" className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="oe-card oe-pad rise">
        <Logo />
        <h1 className="oe-section mt-6">Avisos</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Se quiser receber notificações, deixe um e-mail. O campo é opcional, aceita qualquer texto e não impede o acesso.
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <Field id="contato" label="E-mail para notificações">
            <TextInput id="contato" value={contact} autoComplete="off" onChange={(event) => setContact(event.target.value)} />
          </Field>
          <Button type="submit" className="w-full" pending={pending}>Continuar</Button>
        </form>
        <Link href={ahead} className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl border border-border px-4 text-sm font-medium">
          Agora não
        </Link>
      </div>
    </main>
  );
}
