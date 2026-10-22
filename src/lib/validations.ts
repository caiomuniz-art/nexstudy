import { z } from "zod";

import { saoPauloLocalToIso } from "@/lib/dates";
import { loginLocalPart } from "@/lib/identity";
import { emptyToNull } from "@/lib/text";
import {
  ASSESSMENT_TYPES,
  CATEGORIES,
  DENSITIES,
  PREPARATION_STATUSES,
  PRIORITIES,
  SESSION_STATUSES,
  SUBJECT_COLORS,
  TASK_STATUSES,
  THEMES,
  TASK_VIEWS,
} from "@/types/domain";

const uuid = z.string().uuid("Identificador inválido.");

const passwordSchema = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres.")
  .regex(/[A-Za-zÀ-ÿ]/, "A senha precisa ter pelo menos uma letra.")
  .regex(/[0-9]/, "A senha precisa ter pelo menos um número.");

function optionalUuid(value: string, ctx: z.RefinementCtx, path: string) {
  if (!value) return;
  if (!uuid.safeParse(value).success) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message: "Selecione uma matéria válida." });
  }
}

function optionalDateTime(value: string, ctx: z.RefinementCtx, path: string) {
  if (!value.trim()) return;
  if (!saoPauloLocalToIso(value.trim())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message: "Informe uma data e um horário válidos." });
  }
}

function optionalMinutes(value: string, ctx: z.RefinementCtx, path: string, minimum: number) {
  if (!value.trim()) return;
  if (!/^\d+$/.test(value.trim())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message: "Informe um número inteiro de minutos." });
    return;
  }
  const minutes = Number(value);
  if (minutes < minimum || minutes > 1440) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message: `Use entre ${minimum} e 1440 minutos.`,
    });
  }
}

const entrySchema = z
  .string()
  .min(8, "Use pelo menos 8 caracteres.")
  .regex(/[A-Za-zÀ-ÿ]/, "Inclua pelo menos uma letra.")
  .regex(/[0-9]/, "Inclua pelo menos um número.");

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Preencha este campo.").max(80, "Use no máximo 80 caracteres."),
  password: z.string().min(1, "Preencha este campo."),
  next: z.string().optional(),
});

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Informe seu nome.").max(80, "Use no máximo 80 caracteres."),
    password: entrySchema,
    confirmPassword: z.string().min(1, "Repita a entrada."),
    notificationContact: z.string().max(320, "Use no máximo 320 caracteres.").optional(),
  })
  .superRefine((value, ctx) => {
    if (!loginLocalPart(value.fullName)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["fullName"], message: "Use letras ou números no nome." });
    }
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmPassword"], message: "As duas entradas não coincidem." });
    }
  });

export const notificationContactSchema = z.object({
  contact: z.string().max(320, "Use no máximo 320 caracteres."),
});

export const recoverySchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
});

export const passwordChangeSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Repita a senha."),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmPassword"], message: "As senhas não coincidem." });
    }
  });

export const taskFormSchema = z
  .object({
    title: z.string().trim().min(1, "Informe o título.").max(160, "Use no máximo 160 caracteres."),
    description: z.string().max(4000, "A descrição pode ter no máximo 4000 caracteres."),
    subject_id: z.string(),
    due_at: z.string(),
    priority: z.enum(PRIORITIES),
    status: z.enum(TASK_STATUSES),
    estimated_minutes: z.string(),
    category: z.enum(CATEGORIES),
    notes: z.string().max(4000, "As observações podem ter no máximo 4000 caracteres."),
  })
  .superRefine((value, ctx) => {
    optionalUuid(value.subject_id, ctx, "subject_id");
    optionalDateTime(value.due_at, ctx, "due_at");
    optionalMinutes(value.estimated_minutes, ctx, "estimated_minutes", 0);
  });

export const subjectFormSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da matéria.").max(80, "Use no máximo 80 caracteres."),
  teacher: z.string().max(120, "O nome do professor pode ter no máximo 120 caracteres."),
  color: z.enum(SUBJECT_COLORS.map((color) => color.value) as [string, ...string[]]),
  description: z.string().max(4000, "A descrição pode ter no máximo 4000 caracteres."),
  learning_goals: z.string().max(4000, "Os objetivos podem ter no máximo 4000 caracteres."),
});

export const assessmentFormSchema = z
  .object({
    title: z.string().trim().min(1, "Informe o título.").max(160, "Use no máximo 160 caracteres."),
    subject_id: z.string(),
    type: z.enum(ASSESSMENT_TYPES),
    description: z.string().max(4000, "A descrição pode ter no máximo 4000 caracteres."),
    exam_date: z.string(),
    study_content: z.string().max(4000, "O conteúdo pode ter no máximo 4000 caracteres."),
    preparation_status: z.enum(PREPARATION_STATUSES),
    importance: z.enum(PRIORITIES),
    personal_notes: z.string().max(4000, "As notas podem ter no máximo 4000 caracteres."),
  })
  .superRefine((value, ctx) => {
    optionalUuid(value.subject_id, ctx, "subject_id");
    optionalDateTime(value.exam_date, ctx, "exam_date");
  });

export const scheduleFormSchema = z
  .object({
    subject_id: z.string().uuid("Selecione uma matéria."),
    day_of_week: z.coerce.number().int().min(0).max(6),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, "Informe o horário de início."),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, "Informe o horário de término."),
    room: z.string().max(40, "A sala pode ter no máximo 40 caracteres."),
  })
  .superRefine((value, ctx) => {
    if (value.start_time >= value.end_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_time"],
        message: "O término precisa ser depois do início.",
      });
    }
  });

export const sessionFormSchema = z
  .object({
    title: z.string().trim().min(1, "Informe o título.").max(160, "Use no máximo 160 caracteres."),
    subject_id: z.string(),
    scheduled_at: z.string(),
    duration_minutes: z.string(),
    notes: z.string().max(4000, "As anotações podem ter no máximo 4000 caracteres."),
    status: z.enum(SESSION_STATUSES),
  })
  .superRefine((value, ctx) => {
    optionalUuid(value.subject_id, ctx, "subject_id");
    optionalDateTime(value.scheduled_at, ctx, "scheduled_at");
    optionalMinutes(value.duration_minutes, ctx, "duration_minutes", 1);
    if (!value.duration_minutes.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["duration_minutes"], message: "Informe a duração." });
    }
  });

export const timerSchema = z
  .object({
    title: z.string().trim().min(1, "Informe o que você estudou.").max(160),
    subject_id: z.string(),
    notes: z.string().max(4000),
    elapsed_seconds: z.number().int().min(30, "A sessão ficou curta demais para registrar (menos de 30 segundos)."),
  })
  .superRefine((value, ctx) => {
    optionalUuid(value.subject_id, ctx, "subject_id");
  });

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Informe seu nome.").max(120, "O nome pode ter no máximo 120 caracteres."),
  school: z.string().max(160, "O nome da escola pode ter no máximo 160 caracteres."),
  grade: z.string().max(80, "A série pode ter no máximo 80 caracteres."),
  class_name: z.string().max(80, "A turma pode ter no máximo 80 caracteres."),
});

export const preferencesSchema = z.object({
  theme: z.enum(THEMES),
  tasks_view: z.enum(TASK_VIEWS),
  density: z.enum(DENSITIES),
});

export const notificationPreferencesSchema = z.object({
  deadlines_enabled: z.boolean(),
  overdue_enabled: z.boolean(),
  exams_enabled: z.boolean(),
  assignments_enabled: z.boolean(),
  sessions_enabled: z.boolean(),
  email_opt_in: z.boolean(),
});

export const deleteAccountSchema = z.object({
  confirmation: z.string(),
}).superRefine((value, ctx) => {
  if (value.confirmation !== "EXCLUIR") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confirmation"],
      message: "Digite EXCLUIR para confirmar.",
    });
  }
});

export const idSchema = uuid;

export function fieldErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function toTaskWrite(input: z.infer<typeof taskFormSchema>) {
  return {
    title: input.title.trim(),
    description: emptyToNull(input.description),
    subject_id: input.subject_id || null,
    due_at: input.due_at.trim() ? saoPauloLocalToIso(input.due_at.trim()) : null,
    priority: input.priority,
    status: input.status,
    estimated_minutes: input.estimated_minutes.trim() ? Number(input.estimated_minutes) : null,
    category: input.category,
    notes: emptyToNull(input.notes),
  };
}

export function toSubjectWrite(input: z.infer<typeof subjectFormSchema>) {
  return {
    name: input.name.trim(),
    teacher: emptyToNull(input.teacher),
    color: input.color,
    description: emptyToNull(input.description),
    learning_goals: emptyToNull(input.learning_goals),
  };
}

export function toAssessmentWrite(input: z.infer<typeof assessmentFormSchema>) {
  return {
    title: input.title.trim(),
    subject_id: input.subject_id || null,
    type: input.type,
    description: emptyToNull(input.description),
    exam_date: input.exam_date.trim() ? saoPauloLocalToIso(input.exam_date.trim()) : null,
    study_content: emptyToNull(input.study_content),
    preparation_status: input.preparation_status,
    importance: input.importance,
    personal_notes: emptyToNull(input.personal_notes),
  };
}

export function toScheduleWrite(input: z.infer<typeof scheduleFormSchema>) {
  return {
    subject_id: input.subject_id,
    day_of_week: input.day_of_week,
    start_time: input.start_time,
    end_time: input.end_time,
    room: emptyToNull(input.room),
  };
}

export function toSessionWrite(input: z.infer<typeof sessionFormSchema>) {
  return {
    title: input.title.trim(),
    subject_id: input.subject_id || null,
    scheduled_at: input.scheduled_at.trim() ? saoPauloLocalToIso(input.scheduled_at.trim()) : null,
    duration_minutes: Number(input.duration_minutes),
    notes: emptyToNull(input.notes),
    status: input.status,
  };
}

export function toProfileWrite(input: z.infer<typeof profileSchema>) {
  return {
    full_name: input.full_name.trim(),
    school: emptyToNull(input.school),
    grade: emptyToNull(input.grade),
    class_name: emptyToNull(input.class_name),
  };
}
