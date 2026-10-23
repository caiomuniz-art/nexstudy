import { findScheduleOverlap } from "@/lib/schedule/overlap";
import { deriveNotifications } from "@/lib/notifications/derive";
import { browserAccounts } from "@/lib/local-account";
import {
  assessmentFormSchema,
  deleteAccountSchema,
  fieldErrors,
  notificationContactSchema,
  notificationPreferencesSchema,
  preferencesSchema,
  profileSchema,
  scheduleFormSchema,
  sessionFormSchema,
  subjectFormSchema,
  taskFormSchema,
  timerSchema,
  toAssessmentWrite,
  toProfileWrite,
  toScheduleWrite,
  toSessionWrite,
  toSubjectWrite,
  toTaskWrite,
} from "@/lib/validations";
import type { ZodError } from "zod";
import type {
  AssessmentRow,
  NotificationPreferencesRow,
  NotificationRow,
  PreferencesRow,
  ProfileRow,
  ScheduleRow,
  StudySessionRow,
  SubjectRow,
  TaskRow,
  TaskStatus,
} from "@/types/domain";

type KeyValueStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type LocalResult =
  | { ok: true; message: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const DATA_KEY = "nexstudy.dados";
const VISITOR = "visitante";

export type LocalBook = {
  tasks: TaskRow[];
  subjects: SubjectRow[];
  assessments: AssessmentRow[];
  schedules: ScheduleRow[];
  sessions: StudySessionRow[];
  profile: ProfileRow | null;
  preferences: PreferencesRow | null;
  notificationPreferences: NotificationPreferencesRow | null;
  readKeys: string[];
};

function emptyBook(): LocalBook {
  return {
    tasks: [],
    subjects: [],
    assessments: [],
    schedules: [],
    sessions: [],
    profile: null,
    preferences: null,
    notificationPreferences: null,
    readKeys: [],
  };
}

function now() {
  return new Date().toISOString();
}

function nid() {
  return crypto.randomUUID();
}

function invalid(error: ZodError): LocalResult {
  return { ok: false, error: "Revise os campos destacados.", fieldErrors: fieldErrors(error) };
}

function readFile(store: KeyValueStore): Record<string, LocalBook> {
  try {
    const parsed = JSON.parse(store.getItem(DATA_KEY) || "{}") as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as Record<string, LocalBook>;
  } catch {
    return {};
  }
}

function normalize(value: Partial<LocalBook> | undefined): LocalBook {
  const base = emptyBook();
  if (!value) return base;
  return {
    tasks: Array.isArray(value.tasks) ? value.tasks : [],
    subjects: Array.isArray(value.subjects) ? value.subjects : [],
    assessments: Array.isArray(value.assessments) ? value.assessments : [],
    schedules: Array.isArray(value.schedules) ? value.schedules : [],
    sessions: Array.isArray(value.sessions) ? value.sessions : [],
    profile: value.profile ?? null,
    preferences: value.preferences ?? null,
    notificationPreferences: value.notificationPreferences ?? null,
    readKeys: Array.isArray(value.readKeys) ? value.readKeys.filter((item) => typeof item === "string") : [],
  };
}

export function createLocalWorkspace(store: KeyValueStore, owner: () => string) {
  function read(): LocalBook {
    return normalize(readFile(store)[owner()]);
  }

  function write(book: LocalBook) {
    const file = readFile(store);
    file[owner()] = book;
    store.setItem(DATA_KEY, JSON.stringify(file));
    if (typeof window !== "undefined") window.dispatchEvent(new Event("nexstudy-dados"));
  }

  function missing(id: string, rows: { id: string }[], label: string): LocalResult | null {
    if (!rows.some((row) => row.id === id)) return { ok: false, error: label };
    return null;
  }

  return {
    read,
    clear() {
      const file = readFile(store);
      delete file[owner()];
      store.setItem(DATA_KEY, JSON.stringify(file));
      if (typeof window !== "undefined") window.dispatchEvent(new Event("nexstudy-dados"));
    },
    createTask(input: unknown): LocalResult {
      const parsed = taskFormSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const book = read();
      const writeRow = toTaskWrite(parsed.data);
      const stamp = now();
      book.tasks.unshift({
        id: nid(),
        user_id: owner(),
        ...writeRow,
        completed_at: writeRow.status === "concluida" ? stamp : null,
        created_at: stamp,
        updated_at: stamp,
      });
      write(book);
      return { ok: true, message: "Tarefa criada." };
    },
    updateTask(id: string, input: unknown): LocalResult {
      const parsed = taskFormSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const book = read();
      const current = book.tasks.find((row) => row.id === id);
      if (!current) return { ok: false, error: "Tarefa não encontrada." };
      const writeRow = toTaskWrite(parsed.data);
      let completedAt = current.completed_at;
      if (writeRow.status === "concluida" && current.status !== "concluida") completedAt = now();
      if (writeRow.status !== "concluida") completedAt = null;
      book.tasks = book.tasks.map((row) => row.id === id ? { ...row, ...writeRow, completed_at: completedAt, updated_at: now() } : row);
      write(book);
      return { ok: true, message: "Tarefa atualizada." };
    },
    setTaskStatus(id: string, status: TaskStatus): LocalResult {
      if (!["pendente", "em_andamento", "concluida"].includes(status)) return { ok: false, error: "Status inválido." };
      const book = read();
      const current = book.tasks.find((row) => row.id === id);
      if (!current) return { ok: false, error: "Tarefa não encontrada." };
      let completedAt = current.completed_at;
      if (status === "concluida" && current.status !== "concluida") completedAt = now();
      if (status !== "concluida") completedAt = null;
      book.tasks = book.tasks.map((row) => row.id === id ? { ...row, status, completed_at: completedAt, updated_at: now() } : row);
      write(book);
      return { ok: true, message: status === "concluida" ? "Tarefa concluída." : "Tarefa reaberta." };
    },
    deleteTask(id: string): LocalResult {
      const book = read();
      const gone = missing(id, book.tasks, "Tarefa não encontrada.");
      if (gone) return gone;
      book.tasks = book.tasks.filter((row) => row.id !== id);
      write(book);
      return { ok: true, message: "Tarefa excluída." };
    },
    createSubject(input: unknown): LocalResult {
      const parsed = subjectFormSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const book = read();
      const stamp = now();
      book.subjects.unshift({
        id: nid(),
        user_id: owner(),
        ...toSubjectWrite(parsed.data),
        created_at: stamp,
        updated_at: stamp,
      });
      write(book);
      return { ok: true, message: "Matéria criada." };
    },
    updateSubject(id: string, input: unknown): LocalResult {
      const parsed = subjectFormSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const book = read();
      if (!book.subjects.some((row) => row.id === id)) return { ok: false, error: "Matéria não encontrada." };
      const stamp = now();
      book.subjects = book.subjects.map((row) => row.id === id ? { ...row, ...toSubjectWrite(parsed.data), updated_at: stamp } : row);
      write(book);
      return { ok: true, message: "Matéria atualizada." };
    },
    deleteSubject(id: string): LocalResult {
      const book = read();
      if (!book.subjects.some((row) => row.id === id)) return { ok: false, error: "Matéria não encontrada." };
      const stamp = now();
      const unlink = <T extends { subject_id: string | null }>(rows: T[]) => rows.map((row) => row.subject_id === id ? { ...row, subject_id: null } : row);
      book.subjects = book.subjects.filter((row) => row.id !== id);
      book.tasks = unlink(book.tasks).map((row) => row.subject_id === null ? { ...row, updated_at: stamp } : row);
      book.assessments = unlink(book.assessments);
      book.sessions = unlink(book.sessions);
      book.schedules = unlink(book.schedules);
      write(book);
      return { ok: true, message: "Matéria excluída. Tarefas, provas, aulas e sessões ligadas a ela foram desvinculadas, não apagadas." };
    },
    createAssessment(input: unknown): LocalResult {
      const parsed = assessmentFormSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const book = read();
      const stamp = now();
      book.assessments.unshift({
        id: nid(),
        user_id: owner(),
        ...toAssessmentWrite(parsed.data),
        completed_at: null,
        created_at: stamp,
        updated_at: stamp,
      });
      write(book);
      return { ok: true, message: "Avaliação registrada." };
    },
    updateAssessment(id: string, input: unknown): LocalResult {
      const parsed = assessmentFormSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const book = read();
      if (!book.assessments.some((row) => row.id === id)) return { ok: false, error: "Avaliação não encontrada." };
      book.assessments = book.assessments.map((row) => row.id === id ? { ...row, ...toAssessmentWrite(parsed.data), updated_at: now() } : row);
      write(book);
      return { ok: true, message: "Avaliação atualizada." };
    },
    setAssessmentPreparation(id: string, preparation: string): LocalResult {
      if (!["nao_iniciada", "em_andamento", "revisando", "preparado"].includes(preparation)) {
        return { ok: false, error: "Status de preparação inválido." };
      }
      const book = read();
      if (!book.assessments.some((row) => row.id === id)) return { ok: false, error: "Avaliação não encontrada." };
      book.assessments = book.assessments.map((row) => row.id === id ? { ...row, preparation_status: preparation as AssessmentRow["preparation_status"], updated_at: now() } : row);
      write(book);
      return { ok: true, message: "Preparação atualizada." };
    },
    setAssessmentCompleted(id: string, completed: boolean): LocalResult {
      const book = read();
      if (!book.assessments.some((row) => row.id === id)) return { ok: false, error: "Avaliação não encontrada." };
      book.assessments = book.assessments.map((row) => row.id === id ? { ...row, completed_at: completed ? now() : null, updated_at: now() } : row);
      write(book);
      return { ok: true, message: completed ? "Trabalho marcado como concluído." : "Trabalho reaberto." };
    },
    deleteAssessment(id: string): LocalResult {
      const book = read();
      if (!book.assessments.some((row) => row.id === id)) return { ok: false, error: "Avaliação não encontrada." };
      book.assessments = book.assessments.filter((row) => row.id !== id);
      write(book);
      return { ok: true, message: "Registro excluído." };
    },
    createSchedule(input: unknown): LocalResult {
      const parsed = scheduleFormSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const book = read();
      const writeRow = toScheduleWrite(parsed.data);
      if (findScheduleOverlap(book.schedules, writeRow)) {
        return { ok: false, error: "Este horário se sobrepõe a outra aula no mesmo dia." };
      }
      const stamp = now();
      book.schedules.push({
        id: nid(),
        user_id: owner(),
        ...writeRow,
        created_at: stamp,
        updated_at: stamp,
      });
      write(book);
      return { ok: true, message: "Aula adicionada à grade." };
    },
    updateSchedule(id: string, input: unknown): LocalResult {
      const parsed = scheduleFormSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const book = read();
      if (!book.schedules.some((row) => row.id === id)) return { ok: false, error: "Aula não encontrada." };
      const writeRow = toScheduleWrite(parsed.data);
      if (findScheduleOverlap(book.schedules, { ...writeRow, id })) {
        return { ok: false, error: "Este horário se sobrepõe a outra aula no mesmo dia." };
      }
      book.schedules = book.schedules.map((row) => row.id === id ? { ...row, ...writeRow, updated_at: now() } : row);
      write(book);
      return { ok: true, message: "Horário atualizado." };
    },
    deleteSchedule(id: string): LocalResult {
      const book = read();
      if (!book.schedules.some((row) => row.id === id)) return { ok: false, error: "Aula não encontrada." };
      book.schedules = book.schedules.filter((row) => row.id !== id);
      write(book);
      return { ok: true, message: "Aula removida da grade." };
    },
    createSession(input: unknown): LocalResult {
      const parsed = sessionFormSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const book = read();
      const writeRow = toSessionWrite(parsed.data);
      const stamp = now();
      book.sessions.unshift({
        id: nid(),
        user_id: owner(),
        ...writeRow,
        actual_duration_minutes: writeRow.status === "concluida" ? writeRow.duration_minutes : null,
        created_at: stamp,
        updated_at: stamp,
      });
      write(book);
      return { ok: true, message: "Sessão de estudo salva." };
    },
    updateSession(id: string, input: unknown): LocalResult {
      const parsed = sessionFormSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const book = read();
      if (!book.sessions.some((row) => row.id === id)) return { ok: false, error: "Sessão não encontrada." };
      book.sessions = book.sessions.map((row) => row.id === id ? { ...row, ...toSessionWrite(parsed.data), updated_at: now() } : row);
      write(book);
      return { ok: true, message: "Sessão atualizada." };
    },
    setSessionStatus(id: string, status: StudySessionRow["status"]): LocalResult {
      if (!["agendada", "concluida", "cancelada"].includes(status)) return { ok: false, error: "Status inválido." };
      const book = read();
      const current = book.sessions.find((row) => row.id === id);
      if (!current) return { ok: false, error: "Sessão não encontrada." };
      book.sessions = book.sessions.map((row) => row.id === id ? {
        ...row,
        status,
        actual_duration_minutes: status === "concluida" ? row.actual_duration_minutes ?? row.duration_minutes : row.actual_duration_minutes,
        updated_at: now(),
      } : row);
      write(book);
      return { ok: true, message: status === "concluida" ? "Sessão concluída." : status === "cancelada" ? "Sessão cancelada." : "Sessão reaberta." };
    },
    deleteSession(id: string): LocalResult {
      const book = read();
      if (!book.sessions.some((row) => row.id === id)) return { ok: false, error: "Sessão não encontrada." };
      book.sessions = book.sessions.filter((row) => row.id !== id);
      write(book);
      return { ok: true, message: "Sessão excluída." };
    },
    saveTimer(input: unknown): LocalResult {
      const parsed = timerSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const book = read();
      const minutes = Math.min(1440, Math.max(1, Math.round(parsed.data.elapsed_seconds / 60)));
      const stamp = now();
      book.sessions.unshift({
        id: nid(),
        user_id: owner(),
        title: parsed.data.title.trim(),
        subject_id: parsed.data.subject_id || null,
        notes: parsed.data.notes.trim() || null,
        scheduled_at: stamp,
        duration_minutes: minutes,
        actual_duration_minutes: minutes,
        status: "concluida",
        created_at: stamp,
        updated_at: stamp,
      });
      write(book);
      return { ok: true, message: "Sessão do cronômetro registrada." };
    },
    updateProfile(input: unknown): LocalResult {
      const parsed = profileSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const book = read();
      const writeRow = toProfileWrite(parsed.data);
      const stamp = now();
      book.profile = {
        id: owner(),
        email: book.profile?.email ?? "",
        avatar_url: book.profile?.avatar_url ?? null,
        created_at: book.profile?.created_at ?? stamp,
        ...writeRow,
        updated_at: stamp,
      };
      write(book);
      return { ok: true, message: "Perfil atualizado." };
    },
    async uploadAvatar(formData: FormData): Promise<LocalResult> {
      const file = formData.get("file");
      if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Selecione uma imagem." };
      if (file.size > 2 * 1024 * 1024) return { ok: false, error: "A imagem deve ter no máximo 2 MB." };
      if (!["image/png", "image/webp", "image/jpeg"].includes(file.type)) return { ok: false, error: "Use uma imagem PNG, JPEG ou WebP." };
      const dataUrl = await file.text().then(() => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("read"));
        reader.readAsDataURL(file);
      })).catch(() => "");
      if (!dataUrl.startsWith("data:image/")) return { ok: false, error: "Não foi possível ler a imagem." };
      const book = read();
      const stamp = now();
      book.profile = {
        id: owner(),
        full_name: book.profile?.full_name || "Estudante",
        email: book.profile?.email ?? "",
        school: book.profile?.school ?? null,
        grade: book.profile?.grade ?? null,
        class_name: book.profile?.class_name ?? null,
        avatar_url: dataUrl,
        created_at: book.profile?.created_at ?? stamp,
        updated_at: stamp,
      };
      try {
        write(book);
      } catch {
        return { ok: false, error: "A imagem não coube na memória deste navegador." };
      }
      return { ok: true, message: "Foto atualizada." };
    },
    removeAvatar(): LocalResult {
      const book = read();
      if (book.profile) book.profile = { ...book.profile, avatar_url: null, updated_at: now() };
      write(book);
      return { ok: true, message: "Foto removida." };
    },
    updatePreferences(input: unknown): LocalResult {
      const parsed = preferencesSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const book = read();
      const stamp = now();
      book.preferences = {
        user_id: owner(),
        ...parsed.data,
        created_at: book.preferences?.created_at ?? stamp,
        updated_at: stamp,
      };
      write(book);
      return { ok: true, message: "Preferências salvas." };
    },
    saveNotificationContact(input: unknown): LocalResult {
      const parsed = notificationContactSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const book = read();
      const stamp = now();
      const contact = parsed.data.contact.trim();
      book.notificationPreferences = {
        user_id: owner(),
        deadlines_enabled: book.notificationPreferences?.deadlines_enabled ?? true,
        overdue_enabled: book.notificationPreferences?.overdue_enabled ?? true,
        exams_enabled: book.notificationPreferences?.exams_enabled ?? true,
        assignments_enabled: book.notificationPreferences?.assignments_enabled ?? true,
        sessions_enabled: book.notificationPreferences?.sessions_enabled ?? true,
        email_opt_in: contact.length > 0,
        notification_contact: contact,
        created_at: book.notificationPreferences?.created_at ?? stamp,
        updated_at: stamp,
      };
      write(book);
      return { ok: true, message: "Contato salvo." };
    },
    updateNotificationPreferences(input: unknown): LocalResult {
      const parsed = notificationPreferencesSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const book = read();
      const stamp = now();
      book.notificationPreferences = {
        user_id: owner(),
        notification_contact: book.notificationPreferences?.notification_contact ?? "",
        created_at: book.notificationPreferences?.created_at ?? stamp,
        ...parsed.data,
        updated_at: stamp,
      };
      write(book);
      return { ok: true, message: "Preferências de aviso salvas. Nenhum e-mail é enviado por este aplicativo." };
    },
    markRead(id: string): LocalResult {
      const book = read();
      if (!book.readKeys.includes(id)) book.readKeys.push(id);
      write(book);
      return { ok: true, message: "Aviso marcado como lido." };
    },
    markAllRead(): LocalResult {
      const book = read();
      const keys = new Set(book.readKeys);
      for (const item of noticesFromBook(book)) keys.add(item.dedupe_key);
      book.readKeys = [...keys];
      write(book);
      return { ok: true, message: "Todos os avisos foram marcados como lidos." };
    },
    deleteAccount(input: unknown): LocalResult {
      const parsed = deleteAccountSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      const file = readFile(store);
      delete file[owner()];
      store.setItem(DATA_KEY, JSON.stringify(file));
      if (typeof window !== "undefined") window.dispatchEvent(new Event("nexstudy-dados"));
      return { ok: true, message: "Conta excluída." };
    },
  };
}

export function currentOwner() {
  return browserAccounts()?.current()?.key || VISITOR;
}

export function browserWorkspace() {
  if (typeof localStorage === "undefined") return null;
  return createLocalWorkspace(localStorage, currentOwner);
}

export function readBrowserBook(): LocalBook {
  return browserWorkspace()?.read() ?? emptyBook();
}

export function noticesFromBook(book: LocalBook): NotificationRow[] {
  const drafts = deriveNotifications({
    tasks: book.tasks,
    assessments: book.assessments,
    sessions: book.sessions,
    preferences: book.notificationPreferences,
    now: new Date(),
  });
  const stamp = now();
  return drafts.map((draft) => ({
    id: draft.dedupe_key,
    user_id: "",
    title: draft.title,
    message: draft.message,
    type: draft.type,
    dedupe_key: draft.dedupe_key,
    href: draft.href,
    read_at: book.readKeys.includes(draft.dedupe_key) ? stamp : null,
    created_at: stamp,
  }));
}

export { VISITOR };
