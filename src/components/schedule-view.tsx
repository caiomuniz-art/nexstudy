"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useApplyPageQuery } from "@/lib/client-query";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { SubjectChoices } from "@/components/subject-choices";
import { Alert, Button, Dialog, EmptyState, Field, PageHeader, SelectInput, TextInput } from "@/components/ui";
import { formatTimeLabel } from "@/lib/dates";
import { subjectColor, subjectName } from "@/lib/text";
import { scheduleFormSchema } from "@/lib/validations";
import { FIXED_SUBJECTS } from "@/lib/subjects/fixed";
import { useLocalBook } from "@/lib/use-local-book";
import { createSchedule, deleteSchedule, updateSchedule } from "@/server/actions";
import { WEEK_DAYS, type ScheduleRow, type SubjectRow } from "@/types/domain";

export function ScheduleView({
  schedules: serverSchedules,
  subjects: serverSubjects,
  nova,
  editId,
  presetDay,
  dbMessage,
}: {
  schedules: ScheduleRow[];
  subjects: SubjectRow[];
  nova: boolean;
  editId: string;
  presetDay: number;
  dbMessage: string | null;
}) {
  const stored = useLocalBook();
  const schedules = stored ? stored.schedules : serverSchedules;
  const subjects = stored ? stored.subjects : serverSubjects;
  const router = useRouter();
  const [urlEditId, setUrlEditId] = useState(editId);
  const [dayPreset, setDayPreset] = useState(presetDay);
  const editing = schedules.find((item) => item.id === urlEditId) ?? null;
  const [day, setDay] = useState(presetDay);
  const [dialog, setDialog] = useState<ScheduleRow | "new" | null>(editing ?? (nova ? "new" : null));
  useApplyPageQuery((pageQuery) => {
    if (pageQuery.presetDay !== null) {
      setDay(pageQuery.presetDay);
      setDayPreset(pageQuery.presetDay);
    }
    if (pageQuery.editId) {
      setUrlEditId(pageQuery.editId);
      const found = schedules.find((item) => item.id === pageQuery.editId) ?? null;
      if (found) setDialog(found);
    } else if (pageQuery.nova) setDialog("new");
  });
  const [removing, setRemoving] = useState<ScheduleRow | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader title="Grade horária" description="Aulas da semana. Horários que se cruzam no mesmo dia são recusados." actions={<Button type="button" onClick={() => setDialog("new")}>Nova aula</Button>} />
      {dbMessage ? <Alert tone="error">{dbMessage}</Alert> : null}
      {urlEditId && !editing ? <Alert tone="error">Não encontramos esta aula.</Alert> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="lg:hidden">
        <Field id="dia-mobile" label="Dia">
          <SelectInput id="dia-mobile" value={String(day)} onChange={(event) => setDay(Number(event.target.value))}>
            {WEEK_DAYS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </SelectInput>
        </Field>
      </div>

      {schedules.length === 0 ? <EmptyState title="Nenhuma aula na grade" description="Informe matéria, dia, início e término. A sala e o professor são opcionais." action={<Button type="button" onClick={() => setDialog("new")}>Adicionar aula</Button>} /> : (
        <div className="grid min-w-0 gap-3 lg:grid-cols-7">
          {WEEK_DAYS.map((weekday) => (
            <section key={weekday.value} className={day === weekday.value ? "min-w-0 space-y-2" : "hidden min-w-0 space-y-2 lg:block"}>
              <h2 className="text-sm font-semibold">{weekday.short}</h2>
              {schedules.filter((item) => item.day_of_week === weekday.value).length === 0 ? <p className="text-xs text-muted">Sem aula</p> : schedules.filter((item) => item.day_of_week === weekday.value).map((item) => (
                <article key={item.id} className="rounded-xl border border-border bg-card p-3 text-sm" style={{ borderTop: `3px solid ${subjectColor(subjects, item.subject_id)}` }}>
                  <p className="font-medium">{subjectName(subjects, item.subject_id)}</p>
                  <p className="text-muted">{formatTimeLabel(item.start_time)} – {formatTimeLabel(item.end_time)}</p>
                  {item.room ? <p className="text-muted">Sala {item.room}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" className="inline-flex min-h-11 items-center text-accent" onClick={() => setDialog(item)}>Editar</button>
                    <button type="button" className="inline-flex min-h-11 items-center text-danger" onClick={() => setRemoving(item)}>Excluir</button>
                  </div>
                </article>
              ))}
            </section>
          ))}
        </div>
      )}

      <Dialog open={dialog !== null} title={dialog && dialog !== "new" ? "Editar aula" : "Nova aula"} onClose={() => setDialog(null)}>
        {dialog ? (
          <ScheduleForm
            key={dialog === "new" ? "new" : dialog.id}
            item={dialog === "new" ? null : dialog}
            presetDay={dayPreset}
            onCancel={() => setDialog(null)}
            onDone={(text) => { setMessage(text); setError(""); setDialog(null); router.refresh(); }}
            onError={setError}
          />
        ) : null}
      </Dialog>
      <Dialog open={Boolean(removing)} title="Excluir aula" description="A aula sai da grade. A matéria continua cadastrada." onClose={() => setRemoving(null)}>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setRemoving(null)}>Cancelar</Button>
          <Button type="button" variant="danger" onClick={async () => {
            if (!removing) return;
            const result = await deleteSchedule(removing.id);
            if (!result.ok) setError(result.error);
            else { setMessage(result.message); router.refresh(); }
            setRemoving(null);
          }}>Excluir</Button>
        </div>
      </Dialog>
    </div>
  );
}

function ScheduleForm({ item, presetDay, onCancel, onDone, onError }: { item: ScheduleRow | null; presetDay: number; onCancel: () => void; onDone: (message: string) => void; onError: (message: string) => void }) {
  const form = useForm<z.infer<typeof scheduleFormSchema>>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      subject_id: item?.subject_id || FIXED_SUBJECTS[0].id,
      day_of_week: item?.day_of_week ?? presetDay,
      start_time: item?.start_time.slice(0, 5) ?? "07:30",
      end_time: item?.end_time.slice(0, 5) ?? "08:20",
      room: item?.room ?? "",
    },
  });
  const [error, setError] = useState("");
  async function onSubmit(values: z.infer<typeof scheduleFormSchema>) {
    const result = item ? await updateSchedule(item.id, values) : await createSchedule(values);
    if (!result.ok) { setError(result.error); onError(result.error); return; }
    onDone(result.message);
  }
  return (
    <form className="grid gap-3" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Field id="materia-h" label="Matéria" error={form.formState.errors.subject_id?.message}>
        <SelectInput id="materia-h" {...form.register("subject_id")}>
          <SubjectChoices />
        </SelectInput>
      </Field>
      <Field id="dia-h" label="Dia da semana">
        <SelectInput id="dia-h" {...form.register("day_of_week")}>{WEEK_DAYS.map((weekday) => <option key={weekday.value} value={weekday.value}>{weekday.label}</option>)}</SelectInput>
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field id="inicio" label="Início" error={form.formState.errors.start_time?.message}><TextInput id="inicio" type="time" {...form.register("start_time")} /></Field>
        <Field id="fim" label="Término" error={form.formState.errors.end_time?.message}><TextInput id="fim" type="time" {...form.register("end_time")} /></Field>
      </div>
      <Field id="sala" label="Sala (opcional)"><TextInput id="sala" {...form.register("room")} /></Field>
      <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button><Button type="submit" pending={form.formState.isSubmitting}>Salvar</Button></div>
    </form>
  );
}
