"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Alert, Badge, Button, Dialog, EmptyState, Field, PageHeader, SelectInput, TextArea, TextInput } from "@/components/ui";
import { formatDateTimeBr } from "@/lib/dates";
import { CATEGORY_LABEL, PRIORITY_LABEL, STATUS_LABEL } from "@/lib/labels";
import { paginate } from "@/lib/pagination";
import { isoToSaoPauloLocal } from "@/lib/dates";
import { subjectName } from "@/lib/text";
import { EMPTY_TASK_QUERY, filterTasks, taskCounts, type TaskQuery } from "@/lib/tasks/query";
import { taskFormSchema } from "@/lib/validations";
import { createTask, deleteTask, setTaskStatus, updatePreferences, updateTask } from "@/server/actions";
import { CATEGORIES, DUE_FILTERS, PRIORITIES, TASK_SORTS, TASK_STATUSES, type Density, type TaskRow, type TaskView, type Theme, type SubjectRow } from "@/types/domain";

const DUE_LABEL = { todas: "Todas", atrasadas: "Atrasadas", hoje: "De hoje", futuras: "Futuras", sem_prazo: "Sem prazo" };
const SORT_LABEL = {
  entrega_asc: "Entrega mais próxima",
  entrega_desc: "Entrega mais distante",
  prioridade_desc: "Maior prioridade",
  prioridade_asc: "Menor prioridade",
  criacao_desc: "Criação mais recente",
};

export function TasksView({
  tasks,
  subjects,
  configured,
  theme,
  density,
  initialView,
  nowIso,
  nova,
  editId,
  presetDate,
  truncated,
  dbMessage,
}: {
  tasks: TaskRow[];
  subjects: SubjectRow[];
  configured: boolean;
  theme: Theme;
  density: Density;
  initialView: TaskView;
  nowIso: string;
  nova: boolean;
  editId: string;
  presetDate: string;
  truncated: boolean;
  dbMessage: string | null;
}) {
  const router = useRouter();
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const editingFromUrl = tasks.find((task) => task.id === editId) ?? null;
  const [query, setQuery] = useState<TaskQuery>(EMPTY_TASK_QUERY);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<TaskView>(initialView);
  const [dialog, setDialog] = useState<TaskRow | "new" | null>(editingFromUrl ?? (nova ? "new" : null));
  const [removing, setRemoving] = useState<TaskRow | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState("");

  const filtered = filterTasks(tasks, query, now);
  const counts = taskCounts(tasks, now);
  const pagination = paginate(filtered, page, 8);

  async function changeView(next: TaskView) {
    setView(next);
    localStorage.setItem("oe-tasks-view", next);
    if (!configured) return;
    const result = await updatePreferences({ theme, tasks_view: next, density });
    if (!result.ok) setError(result.error);
    else router.refresh();
  }

  async function changeStatus(task: TaskRow, status: TaskRow["status"]) {
    setPendingId(task.id);
    setError("");
    const result = await setTaskStatus(task.id, status);
    setPendingId("");
    if (!result.ok) setError(result.error);
    else {
      setMessage(result.message);
      router.refresh();
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Tarefas"
        description="Crie, filtre, conclua e reabra. A lista usa os registros da sua conta."
        actions={<Button type="button" onClick={() => { setDialog("new"); setError(""); }}>Nova tarefa</Button>}
      />
      {dbMessage ? <Alert tone="error">{dbMessage}</Alert> : null}
      {editId && !editingFromUrl ? <Alert tone="error">Não encontramos esta tarefa.</Alert> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      {truncated ? <Alert>A lista está limitada a 1000 tarefas mais recentes.</Alert> : null}

      <div className="flex flex-wrap gap-2">
        {DUE_FILTERS.map((due) => (
          <button key={due} type="button" aria-pressed={query.due === due} className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-3 text-sm" onClick={() => { setQuery({ ...query, due }); setPage(1); }}>
            {DUE_LABEL[due]} ({counts[due]})
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Field id="busca" label="Pesquisar por título">
          <TextInput id="busca" value={query.search} onChange={(event) => { setQuery({ ...query, search: event.target.value }); setPage(1); }} />
        </Field>
        <Field id="materia" label="Matéria">
          <SelectInput id="materia" value={query.subjectId} onChange={(event) => { setQuery({ ...query, subjectId: event.target.value }); setPage(1); }}>
            <option value="">Todas</option>
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </SelectInput>
        </Field>
        <Field id="status" label="Status">
          <SelectInput id="status" value={query.status} onChange={(event) => { setQuery({ ...query, status: event.target.value }); setPage(1); }}>
            <option value="">Todos</option>
            {TASK_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
          </SelectInput>
        </Field>
        <Field id="prioridade" label="Prioridade">
          <SelectInput id="prioridade" value={query.priority} onChange={(event) => { setQuery({ ...query, priority: event.target.value }); setPage(1); }}>
            <option value="">Todas</option>
            {PRIORITIES.map((priority) => <option key={priority} value={priority}>{PRIORITY_LABEL[priority]}</option>)}
          </SelectInput>
        </Field>
        <Field id="categoria" label="Categoria">
          <SelectInput id="categoria" value={query.category} onChange={(event) => { setQuery({ ...query, category: event.target.value }); setPage(1); }}>
            <option value="">Todas</option>
            {CATEGORIES.map((category) => <option key={category} value={category}>{CATEGORY_LABEL[category]}</option>)}
          </SelectInput>
        </Field>
        <Field id="ordem" label="Ordenar">
          <SelectInput id="ordem" value={query.sort} onChange={(event) => setQuery({ ...query, sort: event.target.value as TaskQuery["sort"] })}>
            {TASK_SORTS.map((sort) => <option key={sort} value={sort}>{SORT_LABEL[sort]}</option>)}
          </SelectInput>
        </Field>
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 xl:col-span-4">
          <Button type="button" variant="secondary" onClick={() => { setQuery(EMPTY_TASK_QUERY); setPage(1); }}>Limpar filtros</Button>
          <Button type="button" variant="secondary" onClick={() => changeView(view === "lista" ? "cartoes" : "lista")}>{view === "lista" ? "Ver cartões" : "Ver lista"}</Button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState title="Nenhuma tarefa cadastrada" description="Crie a primeira tarefa com prazo, prioridade e matéria. Os filtros ficam disponíveis depois que houver registros." action={<Button type="button" onClick={() => setDialog("new")}>Criar tarefa</Button>} />
      ) : filtered.length === 0 ? (
        <EmptyState title="Nenhuma tarefa corresponde aos filtros" description="Limpe os filtros para ver todas as tarefas da conta." action={<Button type="button" variant="secondary" onClick={() => { setQuery(EMPTY_TASK_QUERY); setPage(1); }}>Limpar filtros</Button>} />
      ) : (
        <div className={view === "cartoes" ? "grid gap-3 md:grid-cols-2" : "space-y-3"}>
          {pagination.items.map((task) => (
            <article key={task.id} className="oe-card oe-pad">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{task.title}</h2>
                  <p className="mt-1 text-sm text-muted">{subjectName(subjects, task.subject_id)} · {formatDateTimeBr(task.due_at)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={task.priority === "alta" ? "danger" : task.priority === "media" ? "warning" : "neutral"}>{PRIORITY_LABEL[task.priority]}</Badge>
                  <Badge tone={task.status === "concluida" ? "success" : "accent"}>{STATUS_LABEL[task.status]}</Badge>
                  <Badge>{CATEGORY_LABEL[task.category]}</Badge>
                </div>
              </div>
              {task.description ? <p className="mt-3 text-sm leading-6">{task.description}</p> : null}
              {task.notes ? <p className="mt-2 text-sm text-muted">Observações: {task.notes}</p> : null}
              {task.estimated_minutes != null ? <p className="mt-2 text-xs text-muted">Tempo estimado: {task.estimated_minutes} min</p> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setDialog(task)}>Editar</Button>
                {task.status !== "concluida" ? (
                  <Button type="button" size="sm" pending={pendingId === task.id} onClick={() => changeStatus(task, "concluida")}>Concluir</Button>
                ) : (
                  <Button type="button" variant="secondary" size="sm" pending={pendingId === task.id} onClick={() => changeStatus(task, "pendente")}>Reabrir</Button>
                )}
                {task.status === "pendente" ? <Button type="button" variant="ghost" size="sm" pending={pendingId === task.id} onClick={() => changeStatus(task, "em_andamento")}>Iniciar</Button> : null}
                <Button type="button" variant="danger" size="sm" onClick={() => setRemoving(task)}>Excluir</Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {filtered.length > 8 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p>Página {pagination.page} de {pagination.pages} · {pagination.total} tarefas</p>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" disabled={pagination.page === 1} onClick={() => setPage(pagination.page - 1)}>Anterior</Button>
            <Button type="button" variant="secondary" size="sm" disabled={pagination.page === pagination.pages} onClick={() => setPage(pagination.page + 1)}>Próxima</Button>
          </div>
        </div>
      ) : null}

      <Dialog open={dialog !== null} title={dialog && dialog !== "new" ? "Editar tarefa" : "Nova tarefa"} onClose={() => setDialog(null)}>
        {dialog ? (
          <TaskForm
            key={dialog === "new" ? "new" : dialog.id}
            task={dialog === "new" ? null : dialog}
            subjects={subjects}
            presetDate={presetDate}
            onCancel={() => setDialog(null)}
            onDone={(text) => { setDialog(null); setMessage(text); router.refresh(); }}
          />
        ) : null}
      </Dialog>

      <Dialog open={Boolean(removing)} title="Excluir tarefa" description={removing ? `Excluir “${removing.title}”? Esta ação não pode ser desfeita.` : undefined} onClose={() => setRemoving(null)}>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setRemoving(null)}>Cancelar</Button>
          <Button type="button" variant="danger" onClick={async () => {
            if (!removing) return;
            const result = await deleteTask(removing.id);
            if (!result.ok) setError(result.error);
            else { setMessage(result.message); router.refresh(); }
            setRemoving(null);
          }}>Excluir</Button>
        </div>
      </Dialog>
      <p className="text-sm text-muted">Também é possível organizar por <Link href="/materias" className="text-accent">matéria</Link>.</p>
    </div>
  );
}

function TaskForm({ task, subjects, presetDate, onCancel, onDone }: { task: TaskRow | null; subjects: SubjectRow[]; presetDate: string; onCancel: () => void; onDone: (message: string) => void }) {
  const form = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      subject_id: task?.subject_id ?? "",
      due_at: task?.due_at ? isoToSaoPauloLocal(task.due_at) : presetDate,
      priority: task?.priority ?? "media",
      status: task?.status ?? "pendente",
      estimated_minutes: task?.estimated_minutes?.toString() ?? "",
      category: task?.category ?? "tarefa",
      notes: task?.notes ?? "",
    },
  });
  const [error, setError] = useState("");

  async function onSubmit(values: z.infer<typeof taskFormSchema>) {
    setError("");
    const result = task ? await updateTask(task.id, values) : await createTask(values);
    if (!result.ok) {
      setError(result.error);
      if (result.fieldErrors) {
        for (const [key, message] of Object.entries(result.fieldErrors)) {
          form.setError(key as keyof z.infer<typeof taskFormSchema>, { message });
        }
      }
      return;
    }
    onDone(result.message);
  }

  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {error ? <div className="sm:col-span-2"><Alert tone="error">{error}</Alert></div> : null}
      <div className="sm:col-span-2">
        <Field id="titulo" label="Título" error={form.formState.errors.title?.message}>
          <TextInput id="titulo" {...form.register("title")} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field id="descricao" label="Descrição" error={form.formState.errors.description?.message}>
          <TextArea id="descricao" {...form.register("description")} />
        </Field>
      </div>
      <Field id="subject_id" label="Matéria" error={form.formState.errors.subject_id?.message}>
        <SelectInput id="subject_id" {...form.register("subject_id")}>
          <option value="">Sem matéria</option>
          {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
        </SelectInput>
      </Field>
      <div className="sm:col-span-2">
        <Field id="due_at" label="Entrega" hint="Horário de Brasília." error={form.formState.errors.due_at?.message}>
          <TextInput id="due_at" type="datetime-local" {...form.register("due_at")} />
        </Field>
      </div>
      <Field id="priority" label="Prioridade" error={form.formState.errors.priority?.message}>
        <SelectInput id="priority" {...form.register("priority")}>
          {PRIORITIES.map((priority) => <option key={priority} value={priority}>{PRIORITY_LABEL[priority]}</option>)}
        </SelectInput>
      </Field>
      <Field id="task-status" label="Status" error={form.formState.errors.status?.message}>
        <SelectInput id="task-status" {...form.register("status")}>
          {TASK_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
        </SelectInput>
      </Field>
      <Field id="categoria-form" label="Categoria" error={form.formState.errors.category?.message}>
        <SelectInput id="categoria-form" {...form.register("category")}>
          {CATEGORIES.map((category) => <option key={category} value={category}>{CATEGORY_LABEL[category]}</option>)}
        </SelectInput>
      </Field>
      <Field id="estimado" label="Tempo estimado (min)" error={form.formState.errors.estimated_minutes?.message}>
        <TextInput id="estimado" inputMode="numeric" {...form.register("estimated_minutes")} />
      </Field>
      <div className="sm:col-span-2">
        <Field id="notes" label="Observações" error={form.formState.errors.notes?.message}>
          <TextArea id="notes" {...form.register("notes")} />
        </Field>
      </div>
      <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" pending={form.formState.isSubmitting}>{task ? "Salvar" : "Criar tarefa"}</Button>
      </div>
    </form>
  );
}
