import { buildCalendarItems } from "@/lib/calendar/items";
import { addCivilDays, civilDateInSaoPaulo, saoPauloToday, startOfWeek } from "@/lib/dates";
import { studiedMinutesInRange } from "@/lib/reports/build";
import type {
  AssessmentRow,
  ScheduleRow,
  StudySessionRow,
  SubjectRow,
  TaskRow,
} from "@/types/domain";

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function buildDashboard(input: {
  tasks: TaskRow[];
  assessments: AssessmentRow[];
  sessions: StudySessionRow[];
  schedules: ScheduleRow[];
  subjects: SubjectRow[];
  now: Date;
}) {
  const today = saoPauloToday(input.now);
  const weekStart = startOfWeek(today);
  const weekDays = Array.from({ length: 7 }, (_, index) => addCivilDays(weekStart, index));
  const agendaDays = Array.from({ length: 5 }, (_, index) => addCivilDays(today, index));
  const agendaItems = buildCalendarItems({ ...input, dates: agendaDays });

  const openTasks = input.tasks.filter((task) => task.status !== "concluida");
  const overdue = openTasks.filter((task) => task.due_at && new Date(task.due_at).getTime() < input.now.getTime());
  const dueSoon = openTasks.filter((task) => {
    if (!task.due_at) return false;
    const due = new Date(task.due_at).getTime();
    return due >= input.now.getTime() && due <= input.now.getTime() + 48 * 60 * 60 * 1000;
  });

  const weekly = weekDays.map((date) => ({
    date,
    label: WEEKDAY_LABELS[new Date(`${date}T12:00:00Z`).getUTCDay()] ?? "",
    concluidas: input.tasks.filter((task) => task.status === "concluida" && task.completed_at && civilDateInSaoPaulo(task.completed_at) === date).length,
  }));

  const upcomingExams = input.assessments
    .filter((assessment) => assessment.type !== "trabalho" && assessment.exam_date && new Date(assessment.exam_date).getTime() >= input.now.getTime())
    .sort((a, b) => (a.exam_date ?? "").localeCompare(b.exam_date ?? ""))
    .slice(0, 5);

  const upcomingAssignments = input.assessments
    .filter((assessment) => assessment.type === "trabalho" && !assessment.completed_at)
    .sort((a, b) => (a.exam_date ?? "9999").localeCompare(b.exam_date ?? "9999"))
    .slice(0, 5);

  const priorities = openTasks
    .filter((task) => task.priority === "alta")
    .sort((a, b) => (a.due_at ?? "9999").localeCompare(b.due_at ?? "9999"))
    .slice(0, 5);

  const total = input.tasks.length;
  const done = input.tasks.filter((task) => task.status === "concluida").length;

  return {
    today,
    pendingCount: input.tasks.filter((task) => task.status === "pendente").length,
    inProgressCount: input.tasks.filter((task) => task.status === "em_andamento").length,
    doneCount: done,
    overdueCount: overdue.length,
    upcomingExams,
    upcomingAssignments,
    priorities,
    weekly,
    progress: total === 0 ? null : { done, total },
    deadlineWarnings: [...overdue, ...dueSoon].slice(0, 6),
    agenda: agendaDays.map((date) => ({
      date,
      items: agendaItems.filter((item) => item.date === date),
    })),
    studiedWeekMinutes: studiedMinutesInRange(input.sessions, weekStart, addCivilDays(weekStart, 6)),
    hasActivity:
      input.tasks.length + input.assessments.length + input.sessions.length + input.schedules.length > 0,
  };
}
