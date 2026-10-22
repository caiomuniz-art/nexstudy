import { cache } from "react";
import { cookies } from "next/headers";

import { isInternalEmail } from "@/lib/identity";
import { deriveNotifications } from "@/lib/notifications/derive";
import { isVisitorValue, VISITOR_COOKIE } from "@/lib/visitor";
import { mapDbError } from "@/lib/errors";
import { SUPABASE_MISSING_MESSAGE } from "@/lib/messages";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  DATA_LIMIT,
  type AssessmentRow,
  type Density,
  type NotificationPreferencesRow,
  type NotificationRow,
  type PreferencesRow,
  type ProfileRow,
  type ScheduleRow,
  type StudySessionRow,
  type SubjectRow,
  type TaskRow,
  type TaskView,
  type Theme,
} from "@/types/domain";

export type ShellInfo = {
  configured: boolean;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  school: string | null;
  grade: string | null;
  className: string | null;
  theme: Theme;
  density: Density;
  tasksView: TaskView;
  unreadCount: number;
  recent: { id: string; title: string; href: string | null; read: boolean }[];
  dbMessage: string | null;
};

export type Workspace =
  | { status: "unconfigured"; shell: ShellInfo }
  | { status: "anonymous" }
  | { status: "error"; message: string; shell: ShellInfo }
  | {
      status: "ready";
      shell: ShellInfo;
      tasks: TaskRow[];
      subjects: SubjectRow[];
      assessments: AssessmentRow[];
      schedules: ScheduleRow[];
      sessions: StudySessionRow[];
      notifications: NotificationRow[];
      preferences: PreferencesRow | null;
      notificationPreferences: NotificationPreferencesRow | null;
      truncated: boolean;
    };

const emptyShell = (configured: boolean, dbMessage: string | null = null): ShellInfo => ({
  configured,
  fullName: "",
  email: "",
  avatarUrl: null,
  school: null,
  grade: null,
  className: null,
  theme: "system",
  density: "confortavel",
  tasksView: "lista",
  unreadCount: 0,
  recent: [],
  dbMessage,
});

function asRows<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

export const loadWorkspace = cache(async (): Promise<Workspace> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "unconfigured", shell: emptyShell(false) };

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    const visitor = isVisitorValue((await cookies()).get(VISITOR_COOKIE)?.value);
    if (visitor) return { status: "unconfigured", shell: emptyShell(false) };
    return { status: "anonymous" };
  }
  const user = authData.user;

  const [profileResult, preferencesResult, notificationPrefsResult, subjectResult, taskResult, assessmentResult, scheduleResult, sessionResult] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("subjects").select("*").eq("user_id", user.id).order("name").limit(DATA_LIMIT),
      supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(DATA_LIMIT),
      supabase.from("assessments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(DATA_LIMIT),
      supabase.from("class_schedules").select("*").eq("user_id", user.id).order("day_of_week").order("start_time").limit(DATA_LIMIT),
      supabase.from("study_sessions").select("*").eq("user_id", user.id).order("scheduled_at", { ascending: false }).limit(DATA_LIMIT),
    ]);

  const firstError = [profileResult.error, preferencesResult.error, subjectResult.error, taskResult.error, assessmentResult.error, scheduleResult.error, sessionResult.error].find(Boolean);
  if (firstError) {
    return { status: "error", message: mapDbError(firstError), shell: emptyShell(true, mapDbError(firstError)) };
  }

  let profile = profileResult.data as ProfileRow | null;
  if (!profile) {
    const fullName = typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : "Estudante";
    const inserted = await supabase
      .from("profiles")
      .insert({ id: user.id, full_name: fullName, email: user.email ?? "" })
      .select("*")
      .maybeSingle();
    if (inserted.error) {
      return { status: "error", message: mapDbError(inserted.error), shell: emptyShell(true, mapDbError(inserted.error)) };
    }
    profile = inserted.data as ProfileRow | null;
  }

  let preferences = preferencesResult.data as PreferencesRow | null;
  if (!preferences) {
    const inserted = await supabase.from("user_preferences").insert({ user_id: user.id }).select("*").maybeSingle();
    preferences = (inserted.data as PreferencesRow | null) ?? null;
  }

  let notificationPreferences = notificationPrefsResult.data as NotificationPreferencesRow | null;
  if (!notificationPreferences && !notificationPrefsResult.error) {
    const inserted = await supabase.from("notification_preferences").insert({ user_id: user.id }).select("*").maybeSingle();
    notificationPreferences = (inserted.data as NotificationPreferencesRow | null) ?? null;
  }

  const tasks = asRows<TaskRow>(taskResult.data);
  const subjects = asRows<SubjectRow>(subjectResult.data);
  const assessments = asRows<AssessmentRow>(assessmentResult.data);
  const schedules = asRows<ScheduleRow>(scheduleResult.data);
  const sessions = asRows<StudySessionRow>(sessionResult.data);

  const drafts = deriveNotifications({
    tasks,
    assessments,
    sessions,
    preferences: notificationPreferences,
    now: new Date(),
  });

  if (drafts.length > 0) {
    await supabase.from("notifications").upsert(
      drafts.map((draft) => ({ ...draft, user_id: user.id })),
      { onConflict: "user_id,dedupe_key" },
    );
  }

  const keys = drafts.map((draft) => draft.dedupe_key);
  if (keys.length === 0) {
    await supabase.from("notifications").delete().eq("user_id", user.id);
  } else {
    const list = keys.map((key) => `"${key}"`).join(",");
    await supabase.from("notifications").delete().eq("user_id", user.id).not("dedupe_key", "in", `(${list})`);
  }

  const notificationResult = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(DATA_LIMIT);

  const notifications = notificationResult.error ? [] : asRows<NotificationRow>(notificationResult.data);
  const unread = notifications.filter((item) => !item.read_at);

  const shell: ShellInfo = {
    configured: true,
    fullName: profile?.full_name || "",
    email: isInternalEmail(user.email) ? (notificationPreferences?.notification_contact?.trim() || "") : (user.email || profile?.email || ""),
    avatarUrl: profile?.avatar_url ?? null,
    school: profile?.school ?? null,
    grade: profile?.grade ?? null,
    className: profile?.class_name ?? null,
    theme: preferences?.theme ?? "system",
    density: preferences?.density ?? "confortavel",
    tasksView: preferences?.tasks_view ?? "lista",
    unreadCount: unread.length,
    recent: unread.slice(0, 5).map((item) => ({
      id: item.id,
      title: item.title,
      href: item.href,
      read: false,
    })),
    dbMessage: notificationResult.error ? mapDbError(notificationResult.error) : null,
  };

  return {
    status: "ready",
    shell,
    tasks,
    subjects,
    assessments,
    schedules,
    sessions,
    notifications,
    preferences,
    notificationPreferences,
    truncated: [tasks, subjects, assessments, schedules, sessions].some((list) => list.length >= DATA_LIMIT),
  };
});

export { SUPABASE_MISSING_MESSAGE };
