"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Alert, Badge, Button, Dialog, EmptyState, Field, PageHeader, SelectInput, TextArea, TextInput } from "@/components/ui";
import { civilDateInSaoPaulo, formatDateTimeBr, isoToSaoPauloLocal } from "@/lib/dates";
import { ASSESSMENT_LABEL, PREPARATION_LABEL, PRIORITY_LABEL } from "@/lib/labels";
import { subjectName } from "@/lib/text";
import { assessmentFormSchema } from "@/lib/validations";
import { createAssessment, deleteAssessment, setAssessmentCompleted, setAssessmentPreparation, updateAssessment } from "@/server/actions";
import { ASSESSMENT_TYPES, PREPARATION_STATUSES, PRIORITIES, type AssessmentRow, type SubjectRow } from "@/types/domain";

export function AssessmentsView({
  assessments,
  subjects,
  nowIso,
  nova,
  editId,
  presetDate,
  dbMessage,
}: {
  assessments: AssessmentRow[];
  subjects: SubjectRow[];
  nowIso: string;
  nova: boolean;
  editId: string;
  presetDate: string;
  dbMessage: string | null;
}) {
  const router = useRouter();
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const editingFromUrl = assessments.find((item) => item.id === editId) ?? null;
  const [subjectId, setSubjectId] = useState("");
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dialog, setDialog] = useState<AssessmentRow | "new" | null>(editingFromUrl ?? (nova ? "new" : null));
  const [removing, setRemoving] = useState<AssessmentRow | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filtered = assessments.filter((item) => {
    if (subjectId && item.subject_id !== subjectId) return false;
    if (type && item.type !== type) return false;
    const civil = item.exam_date ? civilDateInSaoPaulo(item.exam_date) : null;
    if (from && (!civil || civil < from)) return false;
    if (to && (!civil || civil > to)) return false;
    return true;
  });
  const upcoming = assessments
    .filter((item) => item.exam_date && new Date(item.exam_date).getTime() >= now.getTime())
    .sort((a, b) => (a.exam_date ?? "").localeCompare(b.exam_date ?? ""))
    .slice(0, 5);
  const review = assessments.filter((item) => item.preparation_status !== "preparado");

  async function run(action: Promise<{ ok: boolean; error?: string; message?: string }>) {
    const result = await action;
    if (!result.ok) setError(result.error ?? "Não foi possível concluir.");
    else {
      setMessage(result.message ?? "Atualizado.");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader title="Provas e trabalhos" description="Acompanhe data, conteúdo, importância e preparação." actions={<Button type="button" onClick={() => setDialog("new")}>Nova avaliação</Button>} />
      {dbMessage ? <Alert tone="error">{dbMessage}</Alert> : null}
      {editId && !editingFromUrl ? <Alert tone="error">Não encontramos esta avaliação.</Alert> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="oe-card oe-pad">
          <h2 className="font-semibold">Próximas avaliações</h2>
          {upcoming.length === 0 ? <p className="mt-2 text-sm text-muted">Nenhuma data futura cadastrada.</p> : (
            <ul className="mt-3 space-y-2 text-sm">
              {upcoming.map((item) => <li key={item.id}>{item.title} · {ASSESSMENT_LABEL[item.type]} · {formatDateTimeBr(item.exam_date)}</li>)}
            </ul>
          )}
        </article>
        <article className="oe-card oe-pad">
          <h2 className="font-semibold">Conteúdos para revisar</h2>
          {review.length === 0 ? <p className="mt-2 text-sm text-muted">Nada pendente de preparação.</p> : (
            <ul className="mt-3 space-y-2 text-sm">
              {review.map((item) => <li key={item.id}><span className="font-medium">{item.title}</span> · {PREPARATION_LABEL[item.preparation_status]}{item.study_content ? ` · ${item.study_content}` : ""}</li>)}
            </ul>
          )}
        </article>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Field id="filtro-materia" label="Matéria"><SelectInput id="filtro-materia" value={subjectId} onChange={(event) => setSubjectId(event.target.value)}><option value="">Todas</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</SelectInput></Field>
        <Field id="filtro-tipo" label="Tipo"><SelectInput id="filtro-tipo" value={type} onChange={(event) => setType(event.target.value)}><option value="">Todos</option>{ASSESSMENT_TYPES.map((item) => <option key={item} value={item}>{ASSESSMENT_LABEL[item]}</option>)}</SelectInput></Field>
        <Field id="de" label="De"><TextInput id="de" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></Field>
        <Field id="ate" label="Até"><TextInput id="ate" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></Field>
      </div>
      <Button type="button" variant="secondary" className="w-fit" onClick={() => { setSubjectId(""); setType(""); setFrom(""); setTo(""); }}>Limpar filtros</Button>

      {assessments.length === 0 ? <EmptyState title="Nenhuma prova ou trabalho" description="Registre a data, o conteúdo cobrado e o quanto você já estudou." action={<Button type="button" onClick={() => setDialog("new")}>Registrar</Button>} /> : filtered.length === 0 ? <EmptyState title="Nenhum resultado com esses filtros" description="Limpe os filtros para ver todas as avaliações." /> : (
        <div className="grid gap-3">
          {filtered.map((item) => (
            <article key={item.id} className="oe-card oe-pad">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm text-muted">{ASSESSMENT_LABEL[item.type]} · {subjectName(subjects, item.subject_id)} · {formatDateTimeBr(item.exam_date)}</p>
                </div>
                <Badge tone={item.importance === "alta" ? "danger" : "neutral"}>{PRIORITY_LABEL[item.importance]}</Badge>
              </div>
              {item.description ? <p className="mt-3 text-sm">{item.description}</p> : null}
              {item.study_content ? <p className="mt-2 text-sm">Conteúdo: {item.study_content}</p> : null}
              {item.personal_notes ? <p className="mt-2 text-sm text-muted">Notas: {item.personal_notes}</p> : null}
              <div className="mt-4 flex flex-wrap items-end gap-2">
                <Field id={`prep-${item.id}`} label="Preparação">
                  <SelectInput id={`prep-${item.id}`} value={item.preparation_status} onChange={(event) => run(setAssessmentPreparation(item.id, event.target.value))}>
                    {PREPARATION_STATUSES.map((status) => <option key={status} value={status}>{PREPARATION_LABEL[status]}</option>)}
                  </SelectInput>
                </Field>
                {item.type === "trabalho" ? (
                  <Button type="button" variant="secondary" onClick={() => run(setAssessmentCompleted(item.id, !item.completed_at))}>
                    {item.completed_at ? "Reabrir trabalho" : "Marcar trabalho concluído"}
                  </Button>
                ) : null}
                <Button type="button" variant="secondary" onClick={() => setDialog(item)}>Editar</Button>
                <Button type="button" variant="danger" onClick={() => setRemoving(item)}>Excluir</Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={dialog !== null} title={dialog && dialog !== "new" ? "Editar avaliação" : "Nova avaliação"} onClose={() => setDialog(null)}>
        {dialog ? <AssessmentForm key={dialog === "new" ? "new" : dialog.id} item={dialog === "new" ? null : dialog} subjects={subjects} presetDate={presetDate} onCancel={() => setDialog(null)} onDone={(text) => { setMessage(text); setDialog(null); router.refresh(); }} /> : null}
      </Dialog>
      <Dialog open={Boolean(removing)} title="Excluir avaliação" description={removing ? `Excluir “${removing.title}”?` : undefined} onClose={() => setRemoving(null)}>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setRemoving(null)}>Cancelar</Button>
          <Button type="button" variant="danger" onClick={() => { if (!removing) return; void run(deleteAssessment(removing.id)); setRemoving(null); }}>Excluir</Button>
        </div>
      </Dialog>
    </div>
  );
}

function AssessmentForm({ item, subjects, presetDate, onCancel, onDone }: { item: AssessmentRow | null; subjects: SubjectRow[]; presetDate: string; onCancel: () => void; onDone: (message: string) => void }) {
  const form = useForm<z.infer<typeof assessmentFormSchema>>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: {
      title: item?.title ?? "",
      subject_id: item?.subject_id ?? "",
      type: item?.type ?? "prova",
      description: item?.description ?? "",
      exam_date: item?.exam_date ? isoToSaoPauloLocal(item.exam_date) : presetDate,
      study_content: item?.study_content ?? "",
      preparation_status: item?.preparation_status ?? "nao_iniciada",
      importance: item?.importance ?? "media",
      personal_notes: item?.personal_notes ?? "",
    },
  });
  const [error, setError] = useState("");
  async function onSubmit(values: z.infer<typeof assessmentFormSchema>) {
    const result = item ? await updateAssessment(item.id, values) : await createAssessment(values);
    if (!result.ok) { setError(result.error); return; }
    onDone(result.message);
  }
  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {error ? <div className="sm:col-span-2"><Alert tone="error">{error}</Alert></div> : null}
      <div className="sm:col-span-2"><Field id="titulo-av" label="Título" error={form.formState.errors.title?.message}><TextInput id="titulo-av" {...form.register("title")} /></Field></div>
      <Field id="tipo-av" label="Tipo"><SelectInput id="tipo-av" {...form.register("type")}>{ASSESSMENT_TYPES.map((type) => <option key={type} value={type}>{ASSESSMENT_LABEL[type]}</option>)}</SelectInput></Field>
      <Field id="materia-av" label="Matéria"><SelectInput id="materia-av" {...form.register("subject_id")}><option value="">Sem matéria</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</SelectInput></Field>
      <div className="sm:col-span-2"><Field id="data-av" label="Data da avaliação ou entrega" hint="Horário de Brasília." error={form.formState.errors.exam_date?.message}><TextInput id="data-av" type="datetime-local" {...form.register("exam_date")} /></Field></div>
      <Field id="importancia" label="Importância"><SelectInput id="importancia" {...form.register("importance")}>{PRIORITIES.map((priority) => <option key={priority} value={priority}>{PRIORITY_LABEL[priority]}</option>)}</SelectInput></Field>
      <Field id="preparacao" label="Preparação"><SelectInput id="preparacao" {...form.register("preparation_status")}>{PREPARATION_STATUSES.map((status) => <option key={status} value={status}>{PREPARATION_LABEL[status]}</option>)}</SelectInput></Field>
      <div className="sm:col-span-2"><Field id="desc-av" label="Descrição"><TextArea id="desc-av" {...form.register("description")} /></Field></div>
      <div className="sm:col-span-2"><Field id="conteudo" label="Conteúdo cobrado"><TextArea id="conteudo" {...form.register("study_content")} /></Field></div>
      <div className="sm:col-span-2"><Field id="notas" label="Notas pessoais"><TextArea id="notas" {...form.register("personal_notes")} /></Field></div>
      <div className="flex flex-wrap justify-end gap-2 sm:col-span-2"><Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button><Button type="submit" pending={form.formState.isSubmitting}>Salvar</Button></div>
    </form>
  );
}
