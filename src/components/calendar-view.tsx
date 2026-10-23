"use client";

import Link from "next/link";
import { useState } from "react";

import { Button, PageHeader } from "@/components/ui";
import { buildCalendarItems } from "@/lib/calendar/items";
import { addCivilDays, formatCivilBr, formatLongCivil, monthMatrix, shiftAnchor, startOfWeek, visibleDates } from "@/lib/dates";
import { CALENDAR_KIND_LABEL } from "@/lib/labels";
import { cn } from "@/lib/text";
import { useLocalBook } from "@/lib/use-local-book";
import type { AssessmentRow, ScheduleRow, StudySessionRow, SubjectRow, TaskRow } from "@/types/domain";
import { WEEK_DAYS } from "@/types/domain";

export function CalendarView({
  tasks: serverTasks,
  assessments: serverAssessments,
  sessions: serverSessions,
  schedules: serverSchedules,
  subjects: serverSubjects,
  today,
}: {
  tasks: TaskRow[];
  assessments: AssessmentRow[];
  sessions: StudySessionRow[];
  schedules: ScheduleRow[];
  subjects: SubjectRow[];
  today: string;
}) {
  const stored = useLocalBook();
  const tasks = stored ? stored.tasks : serverTasks;
  const assessments = stored ? stored.assessments : serverAssessments;
  const sessions = stored ? stored.sessions : serverSessions;
  const schedules = stored ? stored.schedules : serverSchedules;
  const subjects = stored ? stored.subjects : serverSubjects;
  const [view, setView] = useState<"mes" | "semana" | "dia">("mes");
  const [anchor, setAnchor] = useState(today);
  const [selected, setSelected] = useState(today);
  const dates = [...new Set([...visibleDates(view === "dia" ? selected : anchor, view), selected])];
  const items = buildCalendarItems({ tasks, assessments, sessions, schedules, subjects, dates });
  const selectedItems = items.filter((item) => item.date === selected);
  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${anchor.slice(0, 7)}-01T12:00:00Z`));

  function openDay(date: string) {
    setSelected(date);
    setAnchor(date);
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Calendário"
        description="Tarefas, provas, trabalhos, sessões e aulas."
        actions={
          <div className="flex flex-wrap gap-2">
            {(["mes", "semana", "dia"] as const).map((item) => (
              <Button key={item} type="button" variant={view === item ? "primary" : "secondary"} onClick={() => setView(item)} aria-pressed={view === item}>
                {item === "mes" ? "Mês" : item === "semana" ? "Semana" : "Dia"}
              </Button>
            ))}
          </div>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" onClick={() => { const next = shiftAnchor(view === "dia" ? selected : anchor, view, -1); setAnchor(next); if (view === "dia") setSelected(next); }}>Anterior</Button>
        <Button type="button" variant="secondary" onClick={() => { setAnchor(today); setSelected(today); }}>Hoje</Button>
        <Button type="button" variant="secondary" onClick={() => { const next = shiftAnchor(view === "dia" ? selected : anchor, view, 1); setAnchor(next); if (view === "dia") setSelected(next); }}>Próximo</Button>
        <p className="text-sm capitalize text-muted">{view === "dia" ? formatLongCivil(selected) : view === "semana" ? `Semana de ${formatCivilBr(startOfWeek(anchor))}` : monthLabel}</p>
      </div>

      {view === "mes" ? (
        <div className="oe-card min-w-0 p-2 sm:p-3">
          <div className="grid grid-cols-7 gap-0.5 text-center text-[0.65rem] text-muted sm:gap-1 sm:text-xs">
            {WEEK_DAYS.map((day) => <div key={day.value} className="min-w-0 truncate py-2">{day.short}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {monthMatrix(anchor).map((cell) => {
              const dayItems = items.filter((item) => item.date === cell.date);
              return (
                <button key={cell.date} type="button" onClick={() => openDay(cell.date)} aria-pressed={selected === cell.date} aria-label={`${formatLongCivil(cell.date)}, ${dayItems.length} itens`} className={cn("min-h-11 min-w-0 overflow-hidden rounded-lg border p-0.5 text-left text-xs sm:min-h-16 sm:rounded-xl sm:p-1 md:min-h-24", selected === cell.date ? "border-accent" : "border-transparent", cell.inMonth ? "bg-card" : "opacity-50", cell.date === today && "ring-1 ring-accent")}>
                  <span className="font-medium">{Number(cell.date.slice(8))}</span>
                  <span className="mt-1 hidden flex-col gap-0.5 md:flex">
                    {dayItems.slice(0, 2).map((item) => <span key={item.id} className="truncate" style={{ color: item.color }}>{item.title}</span>)}
                  </span>
                  {dayItems.length > 0 ? <span className="mt-1 block h-1.5 w-1.5 rounded-full md:hidden" style={{ background: dayItems[0]?.color }} /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {view === "semana" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {Array.from({ length: 7 }, (_, index) => addCivilDays(startOfWeek(anchor), index)).map((date) => (
            <button key={date} type="button" onClick={() => openDay(date)} className={cn("oe-card min-w-0 break-words p-3 text-left", selected === date && "ring-2 ring-accent")}>
              <p className="text-sm font-medium">{formatCivilBr(date)}</p>
              <ul className="mt-2 space-y-1 text-xs">
                {items.filter((item) => item.date === date).map((item) => <li key={item.id}>{item.timeLabel ?? "—"} {item.title}</li>)}
              </ul>
            </button>
          ))}
        </div>
      ) : null}

      <section className="oe-card oe-pad">
        <h2 className="font-semibold">{formatLongCivil(selected)}</h2>
        {selectedItems.length === 0 ? <p className="mt-2 text-sm text-muted">Nada salvo neste dia.</p> : (
          <ul className="mt-3 space-y-2 text-sm">
            {selectedItems.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2">
                <span><span className="text-muted">{item.timeLabel ?? "Sem horário"} · {CALENDAR_KIND_LABEL[item.kind]} · </span>{item.title}</span>
                <Link href={item.href} className="text-accent">Abrir para editar</Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/tarefas?nova=1&data=${selected}`} className="oe-btn">Nova tarefa</Link>
          <Link href={`/avaliacoes?nova=1&data=${selected}`} className="inline-flex h-11 items-center rounded-xl border border-border px-3 text-sm">Nova avaliação</Link>
          <Link href={`/estudos?nova=1&data=${selected}`} className="inline-flex h-11 items-center rounded-xl border border-border px-3 text-sm">Nova sessão</Link>
          <Link href={`/horarios?nova=1&dia=${new Date(`${selected}T12:00:00Z`).getUTCDay()}`} className="inline-flex h-11 items-center rounded-xl border border-border px-3 text-sm">Nova aula neste dia</Link>
        </div>
      </section>
    </div>
  );
}
