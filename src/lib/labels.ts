import type { AssessmentType, Category, NotificationType, PreparationStatus, Priority, SessionStatus, TaskStatus } from "@/types/domain";

export const PRIORITY_LABEL: Record<Priority, string> = { baixa: "Baixa", media: "Média", alta: "Alta" };
export const STATUS_LABEL: Record<TaskStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};
export const CATEGORY_LABEL: Record<Category, string> = {
  tarefa: "Tarefa",
  leitura: "Leitura",
  exercicio: "Exercício",
  trabalho: "Trabalho",
  revisao: "Revisão",
  outro: "Outro",
};
export const ASSESSMENT_LABEL: Record<AssessmentType, string> = {
  prova: "Prova",
  trabalho: "Trabalho",
  apresentacao: "Apresentação",
  recuperacao: "Recuperação",
};
export const PREPARATION_LABEL: Record<PreparationStatus, string> = {
  nao_iniciada: "Não iniciada",
  em_andamento: "Em andamento",
  revisando: "Revisando",
  preparado: "Preparado",
};
export const SESSION_LABEL: Record<SessionStatus, string> = {
  agendada: "Agendada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};
export const NOTIFICATION_LABEL: Record<NotificationType, string> = {
  prazo_proximo: "Prazo",
  tarefa_atrasada: "Atraso",
  prova_futura: "Prova",
  trabalho_pendente: "Trabalho",
  sessao_agendada: "Estudo",
};
export const CALENDAR_KIND_LABEL = {
  tarefa: "Tarefa",
  avaliacao: "Avaliação",
  sessao: "Estudo",
  aula: "Aula",
} as const;

export function oneParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function defaultLocalDate(date: string | null) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  return `${date}T09:00`;
}
