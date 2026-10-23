"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Alert, Button, Field, PageHeader, TextInput } from "@/components/ui";
import { useLocalBook } from "@/lib/use-local-book";
import { profileSchema } from "@/lib/validations";
import { removeAvatar, updateProfile, uploadAvatar } from "@/server/actions";

export function ProfileView({
  fullName,
  email,
  school,
  grade,
  className,
  avatarUrl,
  dbMessage,
}: {
  fullName: string;
  email: string;
  school: string;
  grade: string;
  className: string;
  avatarUrl: string | null;
  dbMessage: string | null;
}) {
  const stored = useLocalBook();
  const profile = stored?.profile ?? null;
  const shownName = profile?.full_name || fullName;
  const shownSchool = profile?.school || school;
  const shownGrade = profile?.grade || grade;
  const shownClass = profile?.class_name || className;
  const shownAvatar = profile ? profile.avatar_url : avatarUrl;
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader title="Perfil" description="Nome, série, turma e escola." />
      {dbMessage ? <Alert tone="error">{dbMessage}</Alert> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      <ProfileEditor
        key={`${profile?.updated_at ?? "base"}:${shownAvatar ?? ""}`}
        fullName={shownName}
        email={email}
        school={shownSchool}
        grade={shownGrade}
        className={shownClass}
        avatarUrl={shownAvatar}
        onMessage={setMessage}
        onError={setError}
      />
    </div>
  );
}

function ProfileEditor({
  fullName,
  email,
  school,
  grade,
  className,
  avatarUrl,
  onMessage,
  onError,
}: {
  fullName: string;
  email: string;
  school: string;
  grade: string;
  className: string;
  avatarUrl: string | null;
  onMessage: (message: string) => void;
  onError: (message: string) => void;
}) {
  const router = useRouter();
  const [pendingPhoto, setPendingPhoto] = useState(false);
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: fullName, school, grade, class_name: className },
  });

  return (
    <>
      <section className="oe-card oe-pad">
        <h2 className="font-semibold">Foto</h2>
        <div className="mt-3 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {avatarUrl ? (
            // A foto fica neste navegador, como endereço de dados da própria imagem.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Foto do perfil" className="h-16 w-16 rounded-full object-cover" />
          ) : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-sm">Sem foto</div>}
          <form className="w-full min-w-0" onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setPendingPhoto(true);
            const result = await uploadAvatar(data);
            setPendingPhoto(false);
            if (!result.ok) onError(result.error);
            else { onMessage(result.message); onError(""); router.refresh(); }
          }}>
            <Field id="foto" label="Enviar imagem" hint="PNG, JPEG ou WebP, até 2 MB.">
              <TextInput id="foto" name="file" type="file" accept="image/png,image/jpeg,image/webp" />
            </Field>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="submit" pending={pendingPhoto}>Enviar foto</Button>
              {avatarUrl ? <Button type="button" variant="secondary" onClick={async () => { const result = await removeAvatar(); if (!result.ok) onError(result.error); else { onMessage(result.message); router.refresh(); } }}>Remover foto</Button> : null}
            </div>
          </form>
        </div>
      </section>
      <form className="oe-card oe-pad grid gap-3" onSubmit={form.handleSubmit(async (values) => {
        const result = await updateProfile(values);
        if (!result.ok) onError(result.error);
        else { onMessage(result.message); onError(""); router.refresh(); }
      })} noValidate>
        <Field id="nome" label="Nome" error={form.formState.errors.full_name?.message}><TextInput id="nome" {...form.register("full_name")} /></Field>
        {email ? <Field id="email" label="E-mail"><TextInput id="email" value={email} readOnly /></Field> : null}
        <Field id="serie" label="Série" error={form.formState.errors.grade?.message}><TextInput id="serie" placeholder="Ex.: 2º ano do ensino médio" {...form.register("grade")} /></Field>
        <Field id="turma" label="Turma" error={form.formState.errors.class_name?.message}><TextInput id="turma" {...form.register("class_name")} /></Field>
        <Field id="escola" label="Escola (opcional)" error={form.formState.errors.school?.message}><TextInput id="escola" {...form.register("school")} /></Field>
        <Button type="submit" pending={form.formState.isSubmitting}>Salvar perfil</Button>
      </form>
    </>
  );
}
