import Link from "next/link";
import { redirect } from "next/navigation";

import { WeeklyChart } from "@/components/charts";
import { Alert, Badge, EmptyState, PageHeader } from "@/components/ui";
import { buildDashboard } from "@/lib/dashboard/stats";
import { formatDateTimeBr, formatLongCivil, relativeCivilLabel, salutation } from "@/lib/dates";
import { ASSESSMENT_LABEL, CALENDAR_KIND_LABEL, PRIORITY_LABEL } from "@/lib/labels";
import { firstName, formatMinutes, subjectName } from "@/lib/text";
import { loadWorkspace } from "@/server/data";

export const metadata = { title: "Painel" };

export default async function DashboardPage() {
  const workspace = await loadWorkspace();
  if (workspace.status === "anonymous") redirect("/login");
  const now = new Date();
  const today = formatLongCivil(
    workspace.status === "ready" || workspace.status === "unconfigured" || workspace.status === "error"
      ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now)
      : "2026-01-01",
  );

  if (workspace.status === "unconfigured") {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <PageHeader title={`${salutation(now)}`} description={today} />
        <EmptyState
          title="Nada para resumir ainda"
          description="Cadastre uma matéria e a primeira tarefa para ver o resumo do dia."
          action={<Link href="/tarefas" className="text-sm font-semibold underline decoration-mark underline-offset-4">Criar tarefa</Link>}
        />
      </div>
    );
  }

  if (workspace.status === "error") {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <PageHeader title={salutation(now)} description={today} />
        <Alert tone="error">{workspace.message}</Alert>
      </div>
    );
  }

  const model = buildDashboard({
    tasks: workspace.tasks,
    assessments: workspace.assessments,
    sessions: workspace.sessions,
    schedules: workspace.schedules,
    subjects: workspace.subjects,
    now,
  });
  const name = firstName(workspace.shell.fullName);
  const schoolLine = [workspace.shell.grade, workspace.shell.className, workspace.shell.school].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title={name ? `${salutation(now)}, ${name}` : salutation(now)}
        description={schoolLine ? `${today} · ${schoolLine}` : today}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/tarefas?nova=1" className="oe-btn">Adicionar tarefa</Link>
            <Link href="/avaliacoes?nova=1" className="inline-flex h-10 items-center rounded-xl border border-border px-3 text-sm">Adicionar avaliação</Link>
          </div>
        }
      />
      {!model.hasActivity ? (
        <EmptyState
          title="Sua conta ainda não tem atividades"
          description="Cadastre uma matéria e a primeira tarefa. O resumo, os prazos e o gráfico passam a usar esses registros."
          action={<Link href="/materias?nova=1" className="text-sm font-semibold underline decoration-mark underline-offset-4">Cadastrar matéria</Link>}
        />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Pendentes" value={model.pendingCount} hint="Ainda não iniciadas" />
            <Metric label="Em andamento" value={model.inProgressCount} hint="Começadas e não concluídas" />
            <Metric label="Concluídas" value={model.doneCount} hint="Marcadas como feitas" />
            <Metric label="Atrasadas" value={model.overdueCount} hint="Prazo vencido e em aberto" />
          </section>
          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="oe-card oe-pad">
              <h2 className="font-semibold">Produtividade da semana</h2>
              <p className="mt-1 text-sm text-muted">Tarefas concluídas de segunda a domingo. Dias futuros ficam em zero.</p>
              {workspace.tasks.length === 0 ? (
                <p className="mt-4 text-sm text-muted">Sem tarefas para calcular a semana.</p>
              ) : (
                <div className="mt-4"><WeeklyChart data={model.weekly} /></div>
              )}
            </article>
            <article className="oe-card oe-pad">
              <h2 className="font-semibold">Progresso</h2>
              {model.progress ? (
                <>
                  <p className="mt-2 text-sm text-muted">{model.progress.done} de {model.progress.total} tarefas concluídas.</p>
                  <div className="mt-4 h-2 rounded-full bg-background" aria-hidden>
                    <div className="h-2 rounded-full bg-mark" style={{ width: `${Math.round((model.progress.done / model.progress.total) * 100)}%` }} />
                  </div>
                  <p className="mt-4 text-sm text-muted">Estudo nesta semana: {formatMinutes(model.studiedWeekMinutes)}.</p>
                </>
              ) : <p className="mt-2 text-sm text-muted">Sem atividades para calcular o progresso.</p>}
            </article>
          </section>
          <section className="grid gap-4 lg:grid-cols-2">
            <article className="oe-card oe-pad">
              <h2 className="font-semibold">Prazos e avisos</h2>
              {model.deadlineWarnings.length === 0 ? <p className="mt-3 text-sm text-muted">Nenhum prazo vencido ou nas próximas 48 horas.</p> : (
                <ul className="mt-3 space-y-2 text-sm">
                  {model.deadlineWarnings.map((task) => (
                    <li key={task.id} className="flex items-center justify-between gap-3">
                      <Link href={`/tarefas?editar=${task.id}`} className="font-medium">{task.title}</Link>
                      <span className="text-muted">{formatDateTimeBr(task.due_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
            <article className="oe-card oe-pad">
              <h2 className="font-semibold">Prioridades altas</h2>
              {model.priorities.length === 0 ? <p className="mt-3 text-sm text-muted">Nenhuma tarefa aberta com prioridade alta.</p> : (
                <ul className="mt-3 space-y-2 text-sm">
                  {model.priorities.map((task) => (
                    <li key={task.id} className="flex items-center justify-between gap-3">
                      <Link href={`/tarefas?editar=${task.id}`}>{task.title}</Link>
                      <Badge tone="danger">{PRIORITY_LABEL[task.priority]}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </article>
            <article className="oe-card oe-pad">
              <h2 className="font-semibold">Próximas provas</h2>
              {model.upcomingExams.length === 0 ? <p className="mt-3 text-sm text-muted">Nenhuma prova futura cadastrada.</p> : (
                <ul className="mt-3 space-y-2 text-sm">
                  {model.upcomingExams.map((item) => (
                    <li key={item.id}><Link href={`/avaliacoes?editar=${item.id}`}>{item.title}</Link> <span className="text-muted">· {ASSESSMENT_LABEL[item.type]} · {formatDateTimeBr(item.exam_date)}</span></li>
                  ))}
                </ul>
              )}
            </article>
            <article className="oe-card oe-pad">
              <h2 className="font-semibold">Próximos trabalhos</h2>
              {model.upcomingAssignments.length === 0 ? <p className="mt-3 text-sm text-muted">Nenhum trabalho em aberto.</p> : (
                <ul className="mt-3 space-y-2 text-sm">
                  {model.upcomingAssignments.map((item) => (
                    <li key={item.id}><Link href={`/avaliacoes?editar=${item.id}`}>{item.title}</Link> <span className="text-muted">· {subjectName(workspace.subjects, item.subject_id)} · {formatDateTimeBr(item.exam_date)}</span></li>
                  ))}
                </ul>
              )}
            </article>
          </section>
          <section className="oe-card oe-pad">
            <h2 className="font-semibold">Agenda dos próximos dias</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {model.agenda.map((day) => (
                <div key={day.date} className="rounded-xl border border-border p-3">
                  <p className="text-sm font-medium">{relativeCivilLabel(day.date, model.today)}</p>
                  {day.items.length === 0 ? <p className="mt-2 text-xs text-muted">Nada neste dia.</p> : (
                    <ul className="mt-2 space-y-1 text-xs">
                      {day.items.slice(0, 4).map((item) => (
                        <li key={item.id}><Link href={item.href}>{item.timeLabel ? `${item.timeLabel} · ` : ""}{item.title}</Link> <span className="text-muted">({CALENDAR_KIND_LABEL[item.kind]})</span></li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <article className="oe-card oe-pad">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </article>
  );
}
