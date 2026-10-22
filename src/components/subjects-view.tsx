"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Alert, Button, Dialog, EmptyState, Field, PageHeader, SelectInput, TextArea, TextInput } from "@/components/ui";
import { summarizeSubject } from "@/lib/subjects/summary";
import { formatMinutes } from "@/lib/text";
import { subjectFormSchema } from "@/lib/validations";
import { createSubject, deleteSubject, updateSubject } from "@/server/actions";
import { SUBJECT_COLORS, type AssessmentRow, type StudySessionRow, type SubjectRow, type TaskRow } from "@/types/domain";

export function SubjectsView({
  subjects,
  tasks,
  assessments,
  sessions,
  nova,
  editId,
  dbMessage,
}: {
  subjects: SubjectRow[];
  tasks: TaskRow[];
  assessments: AssessmentRow[];
  sessions: StudySessionRow[];
  nova: boolean;
  editId: string;
  dbMessage: string | null;
}) {
  const router = useRouter();
  const editing = subjects.find((item) => item.id === editId) ?? null;
  const [dialog, setDialog] = useState<SubjectRow | "new" | null>(editing ?? (nova ? "new" : null));
  const [removing, setRemoving] = useState<SubjectRow | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const removingSummary = removing ? summarizeSubject(removing.id, tasks, assessments, sessions) : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader title="Matérias" description="Nome, professor, cor, descrição e objetivos. Excluir desvincula os registros, sem apagá-los." actions={<Button type="button" onClick={() => setDialog("new")}>Nova matéria</Button>} />
      {dbMessage ? <Alert tone="error">{dbMessage}</Alert> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      {subjects.length === 0 ? <EmptyState title="Nenhuma matéria cadastrada" description="Crie as disciplinas para ligar tarefas, provas, aulas e estudos." action={<Button type="button" onClick={() => setDialog("new")}>Criar matéria</Button>} /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {subjects.map((subject) => {
            const summary = summarizeSubject(subject.id, tasks, assessments, sessions);
            return (
              <article key={subject.id} className="oe-card oe-pad" style={{ borderTop: `4px solid ${subject.color}` }}>
                <h2 className="font-semibold">{subject.name}</h2>
                <p className="mt-1 text-sm text-muted">{subject.teacher || "Professor não informado"}</p>
                {subject.description ? <p className="mt-3 text-sm">{subject.description}</p> : null}
                {subject.learning_goals ? <p className="mt-2 text-sm">Objetivos: {subject.learning_goals}</p> : null}
                <p className="mt-3 text-sm text-muted">{summary.tasks} tarefas ({summary.pendingTasks} em aberto) · {summary.assessments} avaliações · {summary.sessions} sessões · {formatMinutes(summary.studiedMinutes)} estudados</p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  <Link href={`/tarefas`} className="text-accent">Ver tarefas</Link>
                  <button type="button" className="text-accent" onClick={() => setDialog(subject)}>Editar</button>
                  <button type="button" className="text-danger" onClick={() => setRemoving(subject)}>Excluir</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Dialog open={dialog !== null} title={dialog && dialog !== "new" ? "Editar matéria" : "Nova matéria"} onClose={() => setDialog(null)}>
        {dialog ? <SubjectForm key={dialog === "new" ? "new" : dialog.id} item={dialog === "new" ? null : dialog} onCancel={() => setDialog(null)} onDone={(text) => { setMessage(text); setDialog(null); router.refresh(); }} /> : null}
      </Dialog>
      <Dialog open={Boolean(removing)} title="Excluir matéria" description={removingSummary ? `“${removing?.name}” está ligada a ${removingSummary.tasks} tarefas, ${removingSummary.assessments} avaliações e ${removingSummary.sessions} sessões. Esses registros serão desvinculados e não serão apagados.` : undefined} onClose={() => setRemoving(null)}>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setRemoving(null)}>Cancelar</Button>
          <Button type="button" variant="danger" onClick={async () => {
            if (!removing) return;
            const result = await deleteSubject(removing.id);
            if (!result.ok) setError(result.error);
            else { setMessage(result.message); router.refresh(); }
            setRemoving(null);
          }}>Excluir e desvincular</Button>
        </div>
      </Dialog>
    </div>
  );
}

function SubjectForm({ item, onCancel, onDone }: { item: SubjectRow | null; onCancel: () => void; onDone: (message: string) => void }) {
  const form = useForm<z.infer<typeof subjectFormSchema>>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      name: item?.name ?? "",
      teacher: item?.teacher ?? "",
      color: SUBJECT_COLORS.find((color) => color.value === item?.color)?.value ?? SUBJECT_COLORS[0].value,
      description: item?.description ?? "",
      learning_goals: item?.learning_goals ?? "",
    },
  });
  const [error, setError] = useState("");
  async function onSubmit(values: z.infer<typeof subjectFormSchema>) {
    const result = item ? await updateSubject(item.id, values) : await createSubject(values);
    if (!result.ok) { setError(result.error); return; }
    onDone(result.message);
  }
  return (
    <form className="grid gap-3" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Field id="nome" label="Nome" error={form.formState.errors.name?.message}><TextInput id="nome" {...form.register("name")} /></Field>
      <Field id="professor" label="Professor (opcional)"><TextInput id="professor" {...form.register("teacher")} /></Field>
      <Field id="cor" label="Cor">
        <SelectInput id="cor" {...form.register("color")}>
          {SUBJECT_COLORS.map((color) => <option key={color.value} value={color.value}>{color.label}</option>)}
        </SelectInput>
      </Field>
      <Field id="descricao-m" label="Descrição"><TextArea id="descricao-m" {...form.register("description")} /></Field>
      <Field id="objetivos" label="Objetivos de aprendizagem"><TextArea id="objetivos" {...form.register("learning_goals")} /></Field>
      <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button><Button type="submit" pending={form.formState.isSubmitting}>Salvar</Button></div>
    </form>
  );
}
