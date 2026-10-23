"use client";

import { useState } from "react";

import { ReportCharts } from "@/components/charts";
import { Alert, EmptyState, Field, PageHeader, SelectInput } from "@/components/ui";
import { formatCivilBr } from "@/lib/dates";
import { buildReport } from "@/lib/reports/build";
import { useLocalBook } from "@/lib/use-local-book";
import { PERIODS, type PeriodKey, type StudySessionRow, type SubjectRow, type TaskRow } from "@/types/domain";

const PERIOD_LABEL: Record<PeriodKey, string> = {
  esta_semana: "Esta semana",
  semana_passada: "Semana passada",
  este_mes: "Este mês",
  ultimos_30: "Últimos 30 dias",
  este_ano: "Este ano",
};

export function ReportsView({
  tasks: serverTasks,
  sessions: serverSessions,
  subjects: serverSubjects,
  today,
  nowIso,
  dbMessage,
}: {
  tasks: TaskRow[];
  sessions: StudySessionRow[];
  subjects: SubjectRow[];
  today: string;
  nowIso: string;
  dbMessage: string | null;
}) {
  const stored = useLocalBook();
  const tasks = stored ? stored.tasks : serverTasks;
  const sessions = stored ? stored.sessions : serverSessions;
  const subjects = stored ? stored.subjects : serverSubjects;
  const [period, setPeriod] = useState<PeriodKey>("esta_semana");
  const report = buildReport({ tasks, sessions, subjects, period, today, now: new Date(nowIso) });
  const hasSource = tasks.length > 0 || sessions.length > 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader title="Relatórios" description="Conclusões, atrasos e tempo de estudo no período escolhido." />
      {dbMessage ? <Alert tone="error">{dbMessage}</Alert> : null}
      <Field id="periodo" label="Período">
        <SelectInput id="periodo" value={period} onChange={(event) => setPeriod(event.target.value as PeriodKey)}>
          {PERIODS.map((item) => <option key={item} value={item}>{PERIOD_LABEL[item]}</option>)}
        </SelectInput>
      </Field>
      <p className="text-sm text-muted">De {formatCivilBr(report.range.start)} até {formatCivilBr(report.range.end)}. Agrupamento por {report.grouping === "day" ? "dia" : "semana"}.</p>
      {!hasSource ? (
        <EmptyState title="Sem dados para os gráficos" description="Conclua uma tarefa ou registre uma sessão de estudo." />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <article className="oe-card oe-pad"><p className="text-sm text-muted">Concluídas no período</p><p className="mt-2 text-3xl font-semibold">{report.completedTotal}</p></article>
            <article className="oe-card oe-pad"><p className="text-sm text-muted">Minutos estudados no período</p><p className="mt-2 text-3xl font-semibold">{report.studyTotal}</p></article>
            <article className="oe-card oe-pad"><p className="text-sm text-muted">Atrasadas agora</p><p className="mt-2 text-3xl font-semibold">{report.overdue}</p><p className="mt-1 text-xs text-muted">Contagem atual, não filtrada pelo período.</p></article>
          </section>
          <ReportCharts completed={report.completed} study={report.study} pending={report.pendingBySubject} categories={report.categories} />
        </>
      )}
    </div>
  );
}
