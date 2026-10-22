import { formatDateTimeBr } from "@/lib/dates";
import type {
  AssessmentRow,
  NotificationDraft,
  NotificationPreferencesRow,
  StudySessionRow,
  TaskRow,
} from "@/types/domain";

const DAY = 24 * 60 * 60 * 1000;

const DEFAULT_PREFS: NotificationPreferencesRow = {
  user_id: "",
  deadlines_enabled: true,
  overdue_enabled: true,
  exams_enabled: true,
  assignments_enabled: true,
  sessions_enabled: true,
  email_opt_in: false,
  notification_contact: "",
  created_at: "",
  updated_at: "",
};

export function deriveNotifications(input: {
  tasks: TaskRow[];
  assessments: AssessmentRow[];
  sessions: StudySessionRow[];
  preferences?: NotificationPreferencesRow | null;
  now: Date;
}) {
  const preferences = input.preferences ?? DEFAULT_PREFS;
  const now = input.now.getTime();
  const drafts: NotificationDraft[] = [];

  for (const task of input.tasks) {
    if (task.status === "concluida" || !task.due_at) continue;
    const due = new Date(task.due_at).getTime();
    if (Number.isNaN(due)) continue;
    if (due < now && preferences.overdue_enabled) {
      drafts.push({
        type: "tarefa_atrasada",
        dedupe_key: `tarefa_atrasada:${task.id}`,
        title: "Tarefa atrasada",
        message: `${task.title} venceu em ${formatDateTimeBr(task.due_at)}.`,
        href: `/tarefas?editar=${task.id}`,
      });
    } else if (due >= now && due <= now + 3 * DAY && preferences.deadlines_enabled) {
      drafts.push({
        type: "prazo_proximo",
        dedupe_key: `prazo_proximo:${task.id}`,
        title: "Prazo próximo",
        message: `${task.title} vence em ${formatDateTimeBr(task.due_at)}.`,
        href: `/tarefas?editar=${task.id}`,
      });
    }
  }

  for (const assessment of input.assessments) {
    if (assessment.type === "trabalho") {
      if (assessment.completed_at || !preferences.assignments_enabled) continue;
      const when = assessment.exam_date ? new Date(assessment.exam_date).getTime() : null;
      const withinHorizon = when === null || (when <= now + 14 * DAY);
      if (!withinHorizon) continue;
      drafts.push({
        type: "trabalho_pendente",
        dedupe_key: `trabalho_pendente:${assessment.id}`,
        title: "Trabalho pendente",
        message: assessment.exam_date
          ? `${assessment.title} está previsto para ${formatDateTimeBr(assessment.exam_date)}.`
          : `${assessment.title} ainda não tem data de entrega.`,
        href: `/avaliacoes?editar=${assessment.id}`,
      });
      continue;
    }

    if (!assessment.exam_date || !preferences.exams_enabled) continue;
    const when = new Date(assessment.exam_date).getTime();
    if (Number.isNaN(when) || when < now || when > now + 14 * DAY) continue;
    drafts.push({
      type: "prova_futura",
      dedupe_key: `prova_futura:${assessment.id}`,
      title: "Avaliação próxima",
      message: `${assessment.title} acontece em ${formatDateTimeBr(assessment.exam_date)}.`,
      href: `/avaliacoes?editar=${assessment.id}`,
    });
  }

  for (const session of input.sessions) {
    if (!preferences.sessions_enabled) continue;
    if (session.status === "cancelada" || session.status === "concluida" || !session.scheduled_at) continue;
    const when = new Date(session.scheduled_at).getTime();
    if (Number.isNaN(when) || when < now || when > now + 7 * DAY) continue;
    drafts.push({
      type: "sessao_agendada",
      dedupe_key: `sessao_agendada:${session.id}`,
      title: "Sessão de estudo",
      message: `${session.title} está marcada para ${formatDateTimeBr(session.scheduled_at)}.`,
      href: `/estudos?editar=${session.id}`,
    });
  }

  return drafts;
}
