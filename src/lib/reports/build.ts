import { civilDateInSaoPaulo, enumerateBuckets, periodRange, startOfWeek } from "@/lib/dates";
import { subjectName } from "@/lib/text";
import type { PeriodKey, StudySessionRow, SubjectRow, TaskRow } from "@/types/domain";

export function buildReport(input: {
  tasks: TaskRow[];
  sessions: StudySessionRow[];
  subjects: SubjectRow[];
  period: PeriodKey;
  today: string;
  now: Date;
}) {
  const range = periodRange(input.period, input.today);
  const kind = input.period === "esta_semana" || input.period === "semana_passada" ? "day" : "week";
  const completionBuckets = enumerateBuckets(range.start, range.end, kind).map((bucket) => ({
    ...bucket,
    concluidas: 0,
  }));
  const studyBuckets = enumerateBuckets(range.start, range.end, kind).map((bucket) => ({
    ...bucket,
    minutos: 0,
  }));

  for (const task of input.tasks) {
    if (!task.completed_at || task.status !== "concluida") continue;
    const civil = civilDateInSaoPaulo(task.completed_at);
    if (!civil || civil < range.start || civil > range.end) continue;
    const key = kind === "day" ? civil : startOfWeek(civil);
    const bucket = completionBuckets.find((item) => item.key === key);
    if (bucket) bucket.concluidas += 1;
  }

  for (const session of input.sessions) {
    if (session.status !== "concluida") continue;
    const civil = civilDateInSaoPaulo(session.scheduled_at ?? session.updated_at);
    if (!civil || civil < range.start || civil > range.end) continue;
    const key = kind === "day" ? civil : startOfWeek(civil);
    const bucket = studyBuckets.find((item) => item.key === key);
    if (bucket) bucket.minutos += session.actual_duration_minutes ?? session.duration_minutes;
  }

  const pendingBySubjectMap = new Map<string, number>();
  for (const task of input.tasks) {
    if (task.status === "concluida") continue;
    const label = subjectName(input.subjects, task.subject_id);
    pendingBySubjectMap.set(label, (pendingBySubjectMap.get(label) ?? 0) + 1);
  }

  const categoryMap = new Map<string, number>();
  for (const task of input.tasks) {
    const created = civilDateInSaoPaulo(task.created_at);
    if (!created || created < range.start || created > range.end) continue;
    categoryMap.set(task.category, (categoryMap.get(task.category) ?? 0) + 1);
  }

  const overdue = input.tasks.filter(
    (task) => task.status !== "concluida" && task.due_at && new Date(task.due_at).getTime() < input.now.getTime(),
  ).length;

  return {
    range,
    grouping: kind,
    completed: completionBuckets,
    study: studyBuckets,
    pendingBySubject: [...pendingBySubjectMap.entries()].map(([materia, pendentes]) => ({ materia, pendentes })),
    categories: [...categoryMap.entries()].map(([categoria, quantidade]) => ({ categoria, quantidade })),
    overdue,
    hasTasks: input.tasks.length > 0,
    hasSessions: input.sessions.length > 0,
    completedTotal: completionBuckets.reduce((sum, bucket) => sum + bucket.concluidas, 0),
    studyTotal: studyBuckets.reduce((sum, bucket) => sum + bucket.minutos, 0),
  };
}

export function studiedMinutesInRange(
  sessions: StudySessionRow[],
  start: string,
  end: string,
) {
  return sessions.reduce((sum, session) => {
    if (session.status !== "concluida") return sum;
    const civil = civilDateInSaoPaulo(session.scheduled_at ?? session.updated_at);
    if (!civil || civil < start || civil > end) return sum;
    return sum + (session.actual_duration_minutes ?? session.duration_minutes);
  }, 0);
}
