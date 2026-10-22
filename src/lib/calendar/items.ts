import { civilDateInSaoPaulo, civilWeekday, formatTimeLabel } from "@/lib/dates";
import { subjectColor, subjectName } from "@/lib/text";
import type {
  AssessmentRow,
  CalendarItem,
  ScheduleRow,
  StudySessionRow,
  SubjectRow,
  TaskRow,
} from "@/types/domain";

const KIND_COLOR: Record<string, string> = {
  tarefa: "#0096ff",
  avaliacao: "#8b5cf6",
  sessao: "#00b3a4",
};

export function buildCalendarItems(input: {
  tasks: TaskRow[];
  assessments: AssessmentRow[];
  sessions: StudySessionRow[];
  schedules: ScheduleRow[];
  subjects: SubjectRow[];
  dates: string[];
}) {
  const dates = new Set(input.dates);
  const items: CalendarItem[] = [];

  for (const task of input.tasks) {
    if (!task.due_at) continue;
    const date = civilDateInSaoPaulo(task.due_at);
    if (!date || !dates.has(date)) continue;
    const timeLabel = formatTimeLabel(civilTime(task.due_at));
    items.push({
      id: `tarefa:${task.id}`,
      kind: "tarefa",
      title: task.title,
      date,
      timeLabel,
      color: task.subject_id ? subjectColor(input.subjects, task.subject_id) : KIND_COLOR.tarefa,
      href: `/tarefas?editar=${task.id}`,
      sortKey: timeLabel ?? "99:99",
    });
  }

  for (const assessment of input.assessments) {
    if (!assessment.exam_date) continue;
    const date = civilDateInSaoPaulo(assessment.exam_date);
    if (!date || !dates.has(date)) continue;
    const timeLabel = formatTimeLabel(civilTime(assessment.exam_date));
    items.push({
      id: `avaliacao:${assessment.id}`,
      kind: "avaliacao",
      title: assessment.title,
      date,
      timeLabel,
      color: assessment.subject_id ? subjectColor(input.subjects, assessment.subject_id) : KIND_COLOR.avaliacao,
      href: `/avaliacoes?editar=${assessment.id}`,
      sortKey: timeLabel ?? "99:99",
    });
  }

  for (const session of input.sessions) {
    if (!session.scheduled_at || session.status === "cancelada") continue;
    const date = civilDateInSaoPaulo(session.scheduled_at);
    if (!date || !dates.has(date)) continue;
    const timeLabel = formatTimeLabel(civilTime(session.scheduled_at));
    items.push({
      id: `sessao:${session.id}`,
      kind: "sessao",
      title: session.title,
      date,
      timeLabel,
      color: session.subject_id ? subjectColor(input.subjects, session.subject_id) : KIND_COLOR.sessao,
      href: `/estudos?editar=${session.id}`,
      sortKey: timeLabel ?? "99:99",
    });
  }

  for (const date of input.dates) {
    const weekday = civilWeekday(date);
    for (const schedule of input.schedules) {
      if (schedule.day_of_week !== weekday) continue;
      const timeLabel = formatTimeLabel(schedule.start_time);
      const name = subjectName(input.subjects, schedule.subject_id);
      items.push({
        id: `aula:${schedule.id}:${date}`,
        kind: "aula",
        title: name,
        date,
        timeLabel,
        color: subjectColor(input.subjects, schedule.subject_id),
        href: `/horarios?editar=${schedule.id}`,
        sortKey: timeLabel ?? "99:99",
      });
    }
  }

  return items.sort((a, b) => a.date.localeCompare(b.date) || a.sortKey.localeCompare(b.sortKey) || a.title.localeCompare(b.title));
}

function civilTime(iso: string) {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour === "24" ? "00" : hour}:${minute}`;
}
