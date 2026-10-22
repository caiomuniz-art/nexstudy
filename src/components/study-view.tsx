"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useApplyPageQuery } from "@/lib/client-query";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Alert, Button, Dialog, EmptyState, Field, PageHeader, SelectInput, TextArea, TextInput } from "@/components/ui";
import { addCivilDays, formatDateTimeBr, isoToSaoPauloLocal, startOfWeek } from "@/lib/dates";
import { SESSION_LABEL } from "@/lib/labels";
import { studiedMinutesInRange } from "@/lib/reports/build";
import { formatMinutes, subjectName } from "@/lib/text";
import { sessionFormSchema } from "@/lib/validations";
import { createSession, deleteSession, saveTimerSession, setSessionStatus, updateSession } from "@/server/actions";
import { SESSION_STATUSES, type StudySessionRow, type SubjectRow } from "@/types/domain";

export function StudyView({
  sessions,
  subjects,
  today,
  nova,
  editId,
  presetDate,
  dbMessage,
}: {
  sessions: StudySessionRow[];
  subjects: SubjectRow[];
  today: string;
  nova: boolean;
  editId: string;
  presetDate: string;
  dbMessage: string | null;
}) {
  const router = useRouter();
  const editing = sessions.find((item) => item.id === editId) ?? null;
  const [datePreset, setDatePreset] = useState(presetDate);
  const [dialog, setDialog] = useState<StudySessionRow | "new" | null>(editing ?? (nova ? "new" : null));
  useApplyPageQuery((pageQuery) => {
    if (pageQuery.presetDate) setDatePreset(pageQuery.presetDate);
    if (pageQuery.editId) {
      const found = sessions.find((item) => item.id === pageQuery.editId) ?? null;
      if (found) setDialog(found);
    } else if (pageQuery.nova) setDialog("new");
  });
  const [removing, setRemoving] = useState<StudySessionRow | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const weekStart = startOfWeek(today);
  const minutes = studiedMinutesInRange(sessions, weekStart, addCivilDays(weekStart, 6));
  const upcoming = sessions.filter((item) => item.status === "agendada" && item.scheduled_at).sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""));
  const history = sessions.filter((item) => item.status === "concluida");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader title="Estudos" description="Planeje sessões e, se quiser, use o cronômetro enquanto esta página estiver aberta." actions={<Button type="button" onClick={() => setDialog("new")}>Nova sessão</Button>} />
      {dbMessage ? <Alert tone="error">{dbMessage}</Alert> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      <section className="oe-card oe-pad">
        <h2 className="font-semibold">Tempo estudado nesta semana</h2>
        <p className="mt-2 text-3xl font-semibold">{sessions.some((item) => item.status === "concluida") ? formatMinutes(minutes) : "Sem sessões concluídas"}</p>
        <p className="mt-1 text-sm text-muted">Soma das sessões concluídas entre segunda e domingo.</p>
      </section>
      <Timer subjects={subjects} onSaved={(text) => { setMessage(text); router.refresh(); }} onError={setError} />
      <section>
        <h2 className="font-semibold">Próximas sessões</h2>
        {upcoming.length === 0 ? <p className="mt-2 text-sm text-muted">Nenhuma sessão agendada.</p> : (
          <ul className="mt-3 space-y-2 text-sm">{upcoming.map((item) => <li key={item.id}>{item.title} · {formatDateTimeBr(item.scheduled_at)} · {item.duration_minutes} min</li>)}</ul>
        )}
      </section>
      {sessions.length === 0 ? <EmptyState title="Nenhuma sessão de estudo" description="Agende matéria, duração e horário, ou finalize uma contagem do cronômetro." action={<Button type="button" onClick={() => setDialog("new")}>Agendar sessão</Button>} /> : (
        <div className="grid gap-3">
          {sessions.map((item) => (
            <article key={item.id} className="oe-card oe-pad">
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-1 text-sm text-muted">{subjectName(subjects, item.subject_id)} · {SESSION_LABEL[item.status]} · {formatDateTimeBr(item.scheduled_at)} · {item.duration_minutes} min{item.actual_duration_minutes != null ? ` · real ${item.actual_duration_minutes} min` : ""}</p>
              {item.notes ? <p className="mt-2 text-sm">{item.notes}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={() => setDialog(item)}>Editar</Button>
                {item.status !== "concluida" ? <Button type="button" size="sm" onClick={async () => { const result = await setSessionStatus(item.id, "concluida"); if (!result.ok) setError(result.error); else { setMessage(result.message); router.refresh(); } }}>Concluir</Button> : <Button type="button" size="sm" variant="secondary" onClick={async () => { const result = await setSessionStatus(item.id, "agendada"); if (!result.ok) setError(result.error); else { setMessage(result.message); router.refresh(); } }}>Reabrir</Button>}
                <Button type="button" size="sm" variant="ghost" onClick={async () => { const result = await setSessionStatus(item.id, "cancelada"); if (!result.ok) setError(result.error); else { setMessage(result.message); router.refresh(); } }}>Cancelar sessão</Button>
                <Button type="button" size="sm" variant="danger" onClick={() => setRemoving(item)}>Excluir</Button>
              </div>
            </article>
          ))}
        </div>
      )}
      <section>
        <h2 className="font-semibold">Histórico</h2>
        {history.length === 0 ? <p className="mt-2 text-sm text-muted">As sessões concluídas aparecem aqui.</p> : <p className="mt-2 text-sm text-muted">{history.length} sessões concluídas na conta.</p>}
      </section>
      <Dialog open={dialog !== null} title={dialog && dialog !== "new" ? "Editar sessão" : "Nova sessão"} onClose={() => setDialog(null)}>
        {dialog ? <SessionForm key={dialog === "new" ? "new" : dialog.id} item={dialog === "new" ? null : dialog} subjects={subjects} presetDate={datePreset} onCancel={() => setDialog(null)} onDone={(text) => { setMessage(text); setDialog(null); router.refresh(); }} /> : null}
      </Dialog>
      <Dialog open={Boolean(removing)} title="Excluir sessão" description={removing ? `Excluir “${removing.title}”?` : undefined} onClose={() => setRemoving(null)}>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setRemoving(null)}>Cancelar</Button>
          <Button type="button" variant="danger" onClick={async () => { if (!removing) return; const result = await deleteSession(removing.id); if (!result.ok) setError(result.error); else { setMessage(result.message); router.refresh(); } setRemoving(null); }}>Excluir</Button>
        </div>
      </Dialog>
    </div>
  );
}

function Timer({ subjects, onSaved, onError }: { subjects: SubjectRow[]; onSaved: (message: string) => void; onError: (message: string) => void }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [notes, setNotes] = useState("");
  const accumulated = useRef(0);
  const started = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      if (started.current != null) setElapsed(accumulated.current + (Date.now() - started.current));
    }, 250);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [running]);

  function pause() {
    if (started.current != null) accumulated.current += Date.now() - started.current;
    started.current = null;
    setElapsed(accumulated.current);
    setRunning(false);
  }

  const totalSeconds = Math.floor(elapsed / 1000);
  const label = `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;

  return (
    <section className="oe-card oe-pad">
      <h2 className="font-semibold">Cronômetro</h2>
      <p className="mt-1 text-sm text-muted">A contagem é precisa enquanto esta página estiver aberta. Fechar o navegador interrompe o cronômetro; ele não continua depois.</p>
      <p className="mt-4 font-mono text-4xl">{label}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {!running ? <Button type="button" onClick={() => { started.current = Date.now(); setRunning(true); }}>{elapsed > 0 ? "Continuar" : "Iniciar"}</Button> : <Button type="button" variant="secondary" onClick={pause}>Pausar</Button>}
        <Button type="button" variant="secondary" onClick={() => { accumulated.current = 0; started.current = null; setElapsed(0); setRunning(false); }}>Zerar</Button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Field id="timer-title" label="O que você estudou"><TextInput id="timer-title" value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
        <Field id="timer-subject" label="Matéria"><SelectInput id="timer-subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)}><option value="">Sem matéria</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</SelectInput></Field>
        <div className="md:col-span-2"><Field id="timer-notes" label="Anotações"><TextArea id="timer-notes" value={notes} onChange={(event) => setNotes(event.target.value)} /></Field></div>
      </div>
      <Button type="button" className="mt-3" onClick={async () => {
        pause();
        const result = await saveTimerSession({ title, subject_id: subjectId, notes, elapsed_seconds: Math.floor((accumulated.current || elapsed) / 1000) });
        if (!result.ok) onError(result.error);
        else {
          accumulated.current = 0;
          setElapsed(0);
          setTitle("");
          setNotes("");
          onSaved(result.message);
        }
      }}>Finalizar e salvar</Button>
    </section>
  );
}

function SessionForm({ item, subjects, presetDate, onCancel, onDone }: { item: StudySessionRow | null; subjects: SubjectRow[]; presetDate: string; onCancel: () => void; onDone: (message: string) => void }) {
  const form = useForm<z.infer<typeof sessionFormSchema>>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      title: item?.title ?? "",
      subject_id: item?.subject_id ?? "",
      scheduled_at: item?.scheduled_at ? isoToSaoPauloLocal(item.scheduled_at) : presetDate,
      duration_minutes: item?.duration_minutes?.toString() ?? "50",
      notes: item?.notes ?? "",
      status: item?.status ?? "agendada",
    },
  });
  const [error, setError] = useState("");
  async function onSubmit(values: z.infer<typeof sessionFormSchema>) {
    const result = item ? await updateSession(item.id, values) : await createSession(values);
    if (!result.ok) { setError(result.error); return; }
    onDone(result.message);
  }
  return (
    <form className="grid gap-3" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Field id="sessao-titulo" label="Título" error={form.formState.errors.title?.message}><TextInput id="sessao-titulo" {...form.register("title")} /></Field>
      <Field id="sessao-materia" label="Matéria"><SelectInput id="sessao-materia" {...form.register("subject_id")}><option value="">Sem matéria</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</SelectInput></Field>
      <Field id="sessao-data" label="Data e horário" hint="Horário de Brasília." error={form.formState.errors.scheduled_at?.message}><TextInput id="sessao-data" type="datetime-local" {...form.register("scheduled_at")} /></Field>
      <Field id="sessao-duracao" label="Duração (minutos)" error={form.formState.errors.duration_minutes?.message}><TextInput id="sessao-duracao" inputMode="numeric" {...form.register("duration_minutes")} /></Field>
      <Field id="sessao-status" label="Status"><SelectInput id="sessao-status" {...form.register("status")}>{SESSION_STATUSES.map((status) => <option key={status} value={status}>{SESSION_LABEL[status]}</option>)}</SelectInput></Field>
      <Field id="sessao-notas" label="Conteúdo estudado"><TextArea id="sessao-notas" {...form.register("notes")} /></Field>
      <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button><Button type="submit" pending={form.formState.isSubmitting}>Salvar</Button></div>
    </form>
  );
}
