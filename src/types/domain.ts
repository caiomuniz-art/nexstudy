export const PRIORITIES = ["baixa", "media", "alta"] as const;
export const TASK_STATUSES = ["pendente", "em_andamento", "concluida"] as const;
export const CATEGORIES = ["tarefa", "leitura", "exercicio", "trabalho", "revisao", "outro"] as const;
export const ASSESSMENT_TYPES = ["prova", "trabalho", "apresentacao", "recuperacao"] as const;
export const PREPARATION_STATUSES = ["nao_iniciada", "em_andamento", "revisando", "preparado"] as const;
export const SESSION_STATUSES = ["agendada", "em_andamento", "concluida", "cancelada"] as const;
export const THEMES = ["light", "dark", "system"] as const;
export const TASK_VIEWS = ["lista", "cartoes"] as const;
export const DENSITIES = ["confortavel", "compacta"] as const;
export const NOTIFICATION_TYPES = [
  "prazo_proximo",
  "tarefa_atrasada",
  "prova_futura",
  "trabalho_pendente",
  "sessao_agendada",
] as const;
export const PERIODS = ["esta_semana", "semana_passada", "este_mes", "ultimos_30", "este_ano"] as const;
export const DUE_FILTERS = ["todas", "atrasadas", "hoje", "futuras", "sem_prazo"] as const;
export const TASK_SORTS = [
  "entrega_asc",
  "entrega_desc",
  "prioridade_desc",
  "prioridade_asc",
  "criacao_desc",
] as const;

export const WEEK_DAYS = [
  { value: 1, label: "Segunda-feira", short: "Seg" },
  { value: 2, label: "Terça-feira", short: "Ter" },
  { value: 3, label: "Quarta-feira", short: "Qua" },
  { value: 4, label: "Quinta-feira", short: "Qui" },
  { value: 5, label: "Sexta-feira", short: "Sex" },
  { value: 6, label: "Sábado", short: "Sáb" },
  { value: 0, label: "Domingo", short: "Dom" },
] as const;

export const SUBJECT_COLORS = [
  { value: "#0096ff", label: "Azul" },
  { value: "#003878", label: "Azul-marinho" },
  { value: "#00b3a4", label: "Verde-azulado" },
  { value: "#00c2f2", label: "Ciano" },
  { value: "#4f46e5", label: "Índigo" },
  { value: "#8b5cf6", label: "Violeta" },
  { value: "#f59e0b", label: "Âmbar" },
  { value: "#e11d48", label: "Carmim" },
] as const;

export const PRIORITY_RANK: Record<Priority, number> = { alta: 0, media: 1, baixa: 2 };

export const DATA_LIMIT = 1000;

export type Priority = (typeof PRIORITIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type Category = (typeof CATEGORIES)[number];
export type AssessmentType = (typeof ASSESSMENT_TYPES)[number];
export type PreparationStatus = (typeof PREPARATION_STATUSES)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export type Theme = (typeof THEMES)[number];
export type TaskView = (typeof TASK_VIEWS)[number];
export type Density = (typeof DENSITIES)[number];
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type PeriodKey = (typeof PERIODS)[number];
export type DueFilter = (typeof DUE_FILTERS)[number];
export type TaskSort = (typeof TASK_SORTS)[number];

export type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  school: string | null;
  grade: string | null;
  class_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type PreferencesRow = {
  user_id: string;
  theme: Theme;
  tasks_view: TaskView;
  density: Density;
  created_at: string;
  updated_at: string;
};

export type NotificationPreferencesRow = {
  user_id: string;
  deadlines_enabled: boolean;
  overdue_enabled: boolean;
  exams_enabled: boolean;
  assignments_enabled: boolean;
  sessions_enabled: boolean;
  email_opt_in: boolean;
  notification_contact: string;
  created_at: string;
  updated_at: string;
};

export type SubjectRow = {
  id: string;
  user_id: string;
  name: string;
  teacher: string | null;
  color: string;
  description: string | null;
  learning_goals: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskRow = {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  due_at: string | null;
  priority: Priority;
  status: TaskStatus;
  estimated_minutes: number | null;
  category: Category;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AssessmentRow = {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  type: AssessmentType;
  description: string | null;
  exam_date: string | null;
  study_content: string | null;
  preparation_status: PreparationStatus;
  importance: Priority;
  personal_notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ScheduleRow = {
  id: string;
  user_id: string;
  subject_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  created_at: string;
  updated_at: string;
};

export type StudySessionRow = {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  scheduled_at: string | null;
  duration_minutes: number;
  notes: string | null;
  status: SessionStatus;
  actual_duration_minutes: number | null;
  created_at: string;
  updated_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  dedupe_key: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export type CalendarKind = "tarefa" | "avaliacao" | "sessao" | "aula";

export type CalendarItem = {
  id: string;
  kind: CalendarKind;
  title: string;
  date: string;
  timeLabel: string | null;
  color: string;
  href: string;
  sortKey: string;
};

export type NotificationDraft = {
  type: NotificationType;
  dedupe_key: string;
  title: string;
  message: string;
  href: string;
};

export type PageState<T> =
  | { status: "unconfigured" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T; truncated: boolean };

export const PRIVATE_ROUTES = [
  { href: "/dashboard", label: "Painel" },
  { href: "/tarefas", label: "Tarefas" },
  { href: "/avaliacoes", label: "Provas e trabalhos" },
  { href: "/horarios", label: "Grade horária" },
  { href: "/calendario", label: "Calendário" },
  { href: "/estudos", label: "Estudos" },
  { href: "/materias", label: "Matérias" },
  { href: "/relatorios", label: "Relatórios" },
  { href: "/notificacoes", label: "Notificações" },
  { href: "/perfil", label: "Perfil" },
  { href: "/configuracoes", label: "Configurações" },
] as const;
