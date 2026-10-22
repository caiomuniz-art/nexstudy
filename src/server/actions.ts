import type { ZodError } from "zod";

import { mapDbError } from "@/lib/errors";
import { findScheduleOverlap } from "@/lib/schedule/overlap";
import { SUPABASE_MISSING_MESSAGE } from "@/lib/messages";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import {
  assessmentFormSchema,
  deleteAccountSchema,
  fieldErrors,
  idSchema,
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
import type { TaskStatus } from "@/types/domain";

export type ActionResult<T = undefined> =
  | { ok: true; message: string; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

async function requireUser() {
  const supabase = createBrowserSupabase();
  if (!supabase) return { ok: false as const, error: SUPABASE_MISSING_MESSAGE };
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { ok: false as const, error: "Sua sessão expirou. Entre novamente." };
  return { ok: true as const, supabase, user: data.user };
}

function refresh() {
  // A interface atualiza a lista no próprio navegador depois de cada ação.
}

function invalid(error: ZodError): ActionResult {
  return { ok: false, error: "Revise os campos destacados.", fieldErrors: fieldErrors(error) };
}

export async function createTask(input: unknown): Promise<ActionResult> {
  const parsed = taskFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const write = toTaskWrite(parsed.data);
  const { error } = await auth.supabase.from("tasks").insert({
    ...write,
    user_id: auth.user.id,
    completed_at: write.status === "concluida" ? new Date().toISOString() : null,
  });
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message: "Tarefa criada." };
}

export async function updateTask(id: string, input: unknown): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Identificador inválido." };
  const parsed = taskFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const current = await auth.supabase.from("tasks").select("status, completed_at").eq("id", id).eq("user_id", auth.user.id).maybeSingle();
  if (current.error) return { ok: false, error: mapDbError(current.error) };
  if (!current.data) return { ok: false, error: "Tarefa não encontrada." };
  const write = toTaskWrite(parsed.data);
  const previous = current.data as { status: TaskStatus; completed_at: string | null };
  let completedAt = previous.completed_at;
  if (write.status === "concluida" && previous.status !== "concluida") completedAt = new Date().toISOString();
  if (write.status !== "concluida") completedAt = null;
  const { error } = await auth.supabase.from("tasks").update({ ...write, completed_at: completedAt }).eq("id", id).eq("user_id", auth.user.id);
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message: "Tarefa atualizada." };
}

export async function setTaskStatus(id: string, status: TaskStatus): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Identificador inválido." };
  if (!["pendente", "em_andamento", "concluida"].includes(status)) return { ok: false, error: "Status inválido." };
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const current = await auth.supabase.from("tasks").select("status, completed_at").eq("id", id).eq("user_id", auth.user.id).maybeSingle();
  if (current.error) return { ok: false, error: mapDbError(current.error) };
  if (!current.data) return { ok: false, error: "Tarefa não encontrada." };
  const previous = current.data as { status: TaskStatus; completed_at: string | null };
  let completedAt = previous.completed_at;
  if (status === "concluida" && previous.status !== "concluida") completedAt = new Date().toISOString();
  if (status !== "concluida") completedAt = null;
  const { error } = await auth.supabase.from("tasks").update({ status, completed_at: completedAt }).eq("id", id).eq("user_id", auth.user.id);
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message: status === "concluida" ? "Tarefa concluída." : "Tarefa reaberta." };
}

export async function deleteTask(id: string): Promise<ActionResult> {
  return deleteOwned("tasks", id, "Tarefa excluída.");
}

export async function createSubject(input: unknown): Promise<ActionResult> {
  const parsed = subjectFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const { error } = await auth.supabase.from("subjects").insert({ ...toSubjectWrite(parsed.data), user_id: auth.user.id });
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message: "Matéria criada." };
}

export async function updateSubject(id: string, input: unknown): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Identificador inválido." };
  const parsed = subjectFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const { error } = await auth.supabase.from("subjects").update(toSubjectWrite(parsed.data)).eq("id", id).eq("user_id", auth.user.id);
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message: "Matéria atualizada." };
}

export async function deleteSubject(id: string): Promise<ActionResult> {
  return deleteOwned("subjects", id, "Matéria excluída. Tarefas, provas, aulas e sessões ligadas a ela foram desvinculadas, não apagadas.");
}

export async function createAssessment(input: unknown): Promise<ActionResult> {
  const parsed = assessmentFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const { error } = await auth.supabase.from("assessments").insert({ ...toAssessmentWrite(parsed.data), user_id: auth.user.id, completed_at: null });
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message: "Avaliação registrada." };
}

export async function updateAssessment(id: string, input: unknown): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Identificador inválido." };
  const parsed = assessmentFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const { error } = await auth.supabase.from("assessments").update(toAssessmentWrite(parsed.data)).eq("id", id).eq("user_id", auth.user.id);
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message: "Avaliação atualizada." };
}

export async function setAssessmentPreparation(id: string, preparation: string): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Identificador inválido." };
  if (!["nao_iniciada", "em_andamento", "revisando", "preparado"].includes(preparation)) {
    return { ok: false, error: "Status de preparação inválido." };
  }
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const { error } = await auth.supabase.from("assessments").update({ preparation_status: preparation }).eq("id", id).eq("user_id", auth.user.id);
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message: "Preparação atualizada." };
}

export async function setAssessmentCompleted(id: string, completed: boolean): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Identificador inválido." };
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const { error } = await auth.supabase
    .from("assessments")
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("user_id", auth.user.id);
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message: completed ? "Trabalho marcado como concluído." : "Trabalho reaberto." };
}

export async function deleteAssessment(id: string): Promise<ActionResult> {
  return deleteOwned("assessments", id, "Registro excluído.");
}

export async function createSchedule(input: unknown): Promise<ActionResult> {
  const parsed = scheduleFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const write = toScheduleWrite(parsed.data);
  const existing = await auth.supabase
    .from("class_schedules")
    .select("id, day_of_week, start_time, end_time")
    .eq("user_id", auth.user.id)
    .eq("day_of_week", write.day_of_week);
  if (existing.error) return { ok: false, error: mapDbError(existing.error) };
  if (findScheduleOverlap((existing.data ?? []) as { id: string; day_of_week: number; start_time: string; end_time: string }[], write)) {
    return { ok: false, error: "Este horário se sobrepõe a outra aula no mesmo dia." };
  }
  const { error } = await auth.supabase.from("class_schedules").insert({ ...write, user_id: auth.user.id });
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message: "Aula adicionada à grade." };
}

export async function updateSchedule(id: string, input: unknown): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Identificador inválido." };
  const parsed = scheduleFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const write = toScheduleWrite(parsed.data);
  const existing = await auth.supabase
    .from("class_schedules")
    .select("id, day_of_week, start_time, end_time")
    .eq("user_id", auth.user.id)
    .eq("day_of_week", write.day_of_week);
  if (existing.error) return { ok: false, error: mapDbError(existing.error) };
  if (findScheduleOverlap((existing.data ?? []) as { id: string; day_of_week: number; start_time: string; end_time: string }[], { ...write, id })) {
    return { ok: false, error: "Este horário se sobrepõe a outra aula no mesmo dia." };
  }
  const { error } = await auth.supabase.from("class_schedules").update(write).eq("id", id).eq("user_id", auth.user.id);
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message: "Horário atualizado." };
}

export async function deleteSchedule(id: string): Promise<ActionResult> {
  return deleteOwned("class_schedules", id, "Aula removida da grade.");
}

export async function createSession(input: unknown): Promise<ActionResult> {
  const parsed = sessionFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const write = toSessionWrite(parsed.data);
  const { error } = await auth.supabase.from("study_sessions").insert({
    ...write,
    user_id: auth.user.id,
    actual_duration_minutes: write.status === "concluida" ? write.duration_minutes : null,
  });
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message: "Sessão de estudo salva." };
}

export async function updateSession(id: string, input: unknown): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Identificador inválido." };
  const parsed = sessionFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const write = toSessionWrite(parsed.data);
  const { error } = await auth.supabase.from("study_sessions").update(write).eq("id", id).eq("user_id", auth.user.id);
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message: "Sessão atualizada." };
}

export async function setSessionStatus(id: string, status: "agendada" | "concluida" | "cancelada"): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Identificador inválido." };
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const { error } = await auth.supabase.from("study_sessions").update({ status }).eq("id", id).eq("user_id", auth.user.id);
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message: status === "concluida" ? "Sessão concluída." : status === "cancelada" ? "Sessão cancelada." : "Sessão reaberta." };
}

export async function deleteSession(id: string): Promise<ActionResult> {
  return deleteOwned("study_sessions", id, "Sessão excluída.");
}

export async function saveTimerSession(input: unknown): Promise<ActionResult> {
  const parsed = timerSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const minutes = Math.min(1440, Math.max(1, Math.round(parsed.data.elapsed_seconds / 60)));
  const { error } = await auth.supabase.from("study_sessions").insert({
    user_id: auth.user.id,
    title: parsed.data.title.trim(),
    subject_id: parsed.data.subject_id || null,
    notes: parsed.data.notes.trim() || null,
    scheduled_at: new Date().toISOString(),
    duration_minutes: minutes,
    actual_duration_minutes: minutes,
    status: "concluida",
  });
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message: "Sessão do cronômetro registrada." };
}

export async function updateProfile(input: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const { error } = await auth.supabase.from("profiles").update(toProfileWrite(parsed.data)).eq("id", auth.user.id);
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message: "Perfil atualizado." };
}

export async function uploadAvatar(formData: FormData): Promise<ActionResult> {
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Selecione uma imagem." };
  if (file.size > 2 * 1024 * 1024) return { ok: false, error: "A imagem deve ter no máximo 2 MB." };
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type === "image/jpeg" ? "jpg" : "";
  if (!extension) return { ok: false, error: "Use uma imagem PNG, JPEG ou WebP." };
  const path = `${auth.user.id}/avatar.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const uploaded = await auth.supabase.storage.from("avatars").upload(path, bytes, {
    upsert: true,
    contentType: file.type,
  });
  if (uploaded.error) {
    return { ok: false, error: "Não foi possível enviar a foto. Tente de novo." };
  }
  const { data } = auth.supabase.storage.from("avatars").getPublicUrl(path);
  const { error } = await auth.supabase.from("profiles").update({ avatar_url: `${data.publicUrl}?v=${Date.now()}` }).eq("id", auth.user.id);
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message: "Foto atualizada." };
}

export async function removeAvatar(): Promise<ActionResult> {
  const auth = await requireUser();
  if (!auth.ok) return auth;
  await auth.supabase.storage.from("avatars").remove([
    `${auth.user.id}/avatar.png`,
    `${auth.user.id}/avatar.jpg`,
    `${auth.user.id}/avatar.webp`,
  ]);
  const { error } = await auth.supabase.from("profiles").update({ avatar_url: null }).eq("id", auth.user.id);
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message: "Foto removida." };
}

export async function updatePreferences(input: unknown): Promise<ActionResult> {
  const parsed = preferencesSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const { error } = await auth.supabase.from("user_preferences").upsert({ user_id: auth.user.id, ...parsed.data });
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message: "Preferências salvas." };
}

export async function saveNotificationContact(input: unknown): Promise<ActionResult> {
  const parsed = notificationContactSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const contact = parsed.data.contact.trim();
  const { error } = await auth.supabase.from("notification_preferences").upsert({
    user_id: auth.user.id,
    notification_contact: contact,
    email_opt_in: contact.length > 0,
  });
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message: "Contato salvo." };
}

export async function updateNotificationPreferences(input: unknown): Promise<ActionResult> {
  const parsed = notificationPreferencesSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const { error } = await auth.supabase.from("notification_preferences").upsert({ user_id: auth.user.id, ...parsed.data });
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message: "Preferências de aviso salvas. Nenhum e-mail é enviado por este aplicativo." };
}

export async function markNotificationRead(id: string): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Identificador inválido." };
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const { error } = await auth.supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).eq("user_id", auth.user.id);
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message: "Aviso marcado como lido." };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const { error } = await auth.supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", auth.user.id)
    .is("read_at", null);
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message: "Todos os avisos foram marcados como lidos." };
}

export async function deleteOwnAccount(input: unknown): Promise<ActionResult> {
  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const { error } = await auth.supabase.rpc("delete_own_account");
  if (error) {
    const message = mapDbError(error);
    if (message === "Não foi possível concluir a operação. Tente novamente.") {
      return {
        ok: false,
        error: "Não foi possível excluir a conta. Tente de novo.",
      };
    }
    return { ok: false, error: message };
  }
  await auth.supabase.auth.signOut();
  return { ok: true, message: "Conta excluída." };
}

export async function logout() {
  const supabase = createBrowserSupabase();
  if (supabase) await supabase.auth.signOut();
}

async function deleteOwned(table: "tasks" | "subjects" | "assessments" | "class_schedules" | "study_sessions", id: string, message: string): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Identificador inválido." };
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const { error } = await auth.supabase.from(table).delete().eq("id", id).eq("user_id", auth.user.id);
  if (error) return { ok: false, error: mapDbError(error) };
  refresh();
  return { ok: true, message };
}
