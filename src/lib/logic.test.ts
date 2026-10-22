import { describe, expect, it } from "vitest";

import { buildCalendarItems } from "@/lib/calendar/items";
import { buildDashboard } from "@/lib/dashboard/stats";
import { addCivilDays, civilDateInSaoPaulo, periodRange, saoPauloLocalToIso, saoPauloToday, startOfWeek } from "@/lib/dates";
import { getSupabasePublicEnv } from "@/lib/env";
import { mapAuthError, mapDbError } from "@/lib/errors";
import { deriveNotifications } from "@/lib/notifications/derive";
import { paginate } from "@/lib/pagination";
import { safeNextPath } from "@/lib/paths";
import { buildReport } from "@/lib/reports/build";
import { findScheduleOverlap, rangesOverlap } from "@/lib/schedule/overlap";
import { summarizeSubject } from "@/lib/subjects/summary";
import { filterTasks, taskCounts } from "@/lib/tasks/query";
import { internalEmail } from "@/lib/identity";
import { loginSchema, scheduleFormSchema, signupSchema, taskFormSchema } from "@/lib/validations";
import type { AssessmentRow, ScheduleRow, StudySessionRow, SubjectRow, TaskRow } from "@/types/domain";

const NOW = new Date("2026-10-22T15:00:00.000Z");

function task(partial: Partial<TaskRow> & Pick<TaskRow, "id" | "title">): TaskRow {
  return {
    user_id: "user-1",
    subject_id: null,
    description: null,
    due_at: null,
    priority: "media",
    status: "pendente",
    estimated_minutes: null,
    category: "tarefa",
    notes: null,
    completed_at: null,
    created_at: "2026-10-01T12:00:00.000Z",
    updated_at: "2026-10-01T12:00:00.000Z",
    ...partial,
  };
}

function assessment(partial: Partial<AssessmentRow> & Pick<AssessmentRow, "id" | "title" | "type">): AssessmentRow {
  return {
    user_id: "user-1",
    subject_id: null,
    description: null,
    exam_date: null,
    study_content: null,
    preparation_status: "nao_iniciada",
    importance: "media",
    personal_notes: null,
    completed_at: null,
    created_at: "2026-10-01T12:00:00.000Z",
    updated_at: "2026-10-01T12:00:00.000Z",
    ...partial,
  };
}

function session(partial: Partial<StudySessionRow> & Pick<StudySessionRow, "id" | "title">): StudySessionRow {
  return {
    user_id: "user-1",
    subject_id: null,
    scheduled_at: null,
    duration_minutes: 50,
    notes: null,
    status: "agendada",
    actual_duration_minutes: null,
    created_at: "2026-10-01T12:00:00.000Z",
    updated_at: "2026-10-01T12:00:00.000Z",
    ...partial,
  };
}

const math: SubjectRow = {
  id: "subject-math",
  user_id: "user-1",
  name: "Matemática",
  teacher: "Ana",
  color: "#1d6fe8",
  description: null,
  learning_goals: null,
  created_at: "2026-10-01T12:00:00.000Z",
  updated_at: "2026-10-01T12:00:00.000Z",
};

describe("datas em America/Sao_Paulo", () => {
  it("converte horário local para UTC sem horário de verão", () => {
    expect(saoPauloLocalToIso("2026-10-22T14:30")).toBe("2026-10-22T17:30:00.000Z");
  });

  it("não deixa a virada do dia em UTC mudar a data civil", () => {
    expect(civilDateInSaoPaulo("2026-10-23T01:30:00.000Z")).toBe("2026-10-22");
    expect(civilDateInSaoPaulo("2026-10-23T03:30:00.000Z")).toBe("2026-10-23");
    expect(saoPauloToday(NOW)).toBe("2026-10-22");
  });

  it("começa a semana na segunda-feira", () => {
    expect(startOfWeek("2026-10-22")).toBe("2026-10-19");
    expect(periodRange("esta_semana", "2026-10-22")).toEqual({
      start: "2026-10-19",
      end: "2026-10-25",
    });
    expect(periodRange("semana_passada", "2026-10-22").start).toBe("2026-10-12");
    expect(addCivilDays("2026-10-22", 1)).toBe("2026-10-23");
  });
});

describe("ambiente", () => {
  it("não aceita variáveis vazias nem placeholder", () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const previousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";
    expect(getSupabasePublicEnv()).toBeNull();

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://your-project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key-not-a-secret-123456";
    expect(getSupabasePublicEnv()).toBeNull();

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abcd.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "short";
    expect(getSupabasePublicEnv()).toBeNull();

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abcd.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key-not-a-secret-123456";
    expect(getSupabasePublicEnv()).toEqual({
      url: "https://abcd.supabase.co",
      anonKey: "test-anon-key-not-a-secret-123456",
    });

    process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousKey;
  });
});

describe("tarefas", () => {
  const tasks = [
    task({ id: "late", title: "Lista atrasada", due_at: "2026-10-21T15:00:00.000Z", priority: "alta", subject_id: "subject-math" }),
    task({ id: "today-open", title: "Exercício de hoje", due_at: "2026-10-22T18:00:00.000Z", status: "em_andamento" }),
    task({ id: "today-done", title: "Leitura concluída", due_at: "2026-10-22T12:00:00.000Z", status: "concluida", completed_at: "2026-10-22T12:30:00.000Z" }),
    task({ id: "future", title: "Trabalho futuro", due_at: "2026-10-28T15:00:00.000Z", priority: "baixa", category: "trabalho" }),
    task({ id: "undated", title: "Sem prazo", notes: "revisar capítulo" }),
  ];

  it("combina pesquisa, matéria, status, prioridade e prazo", () => {
    const result = filterTasks(
      tasks,
      {
        search: "lista",
        subjectId: "subject-math",
        status: "pendente",
        priority: "alta",
        category: "",
        due: "atrasadas",
        sort: "prioridade_desc",
      },
      NOW,
    );
    expect(result.map((item) => item.id)).toEqual(["late"]);
  });

  it("separa atrasadas, hoje, futuras e sem prazo sem contar concluída como atraso", () => {
    const counts = taskCounts(tasks, NOW);
    expect(counts.atrasadas).toBe(1);
    expect(counts.hoje).toBe(2);
    expect(counts.futuras).toBe(1);
    expect(counts.sem_prazo).toBe(1);
  });

  it("ordena por entrega e deixa itens sem data por último", () => {
    const sorted = filterTasks(tasks, { search: "", subjectId: "", status: "", priority: "", category: "", due: "todas", sort: "entrega_asc" }, NOW);
    expect(sorted.at(-1)?.id).toBe("undated");
    expect(sorted[0]?.id).toBe("late");
  });

  it("rejeita título vazio e horário inválido", () => {
    expect(taskFormSchema.safeParse({
      title: "  ",
      description: "",
      subject_id: "",
      due_at: "2026-13-40T99:99",
      priority: "media",
      status: "pendente",
      estimated_minutes: "",
      category: "tarefa",
      notes: "",
    }).success).toBe(false);
  });
});

describe("horários", () => {
  it("detecta sobreposição e permite aulas encostadas", () => {
    expect(rangesOverlap("08:00", "09:00", "08:30", "10:00")).toBe(true);
    expect(rangesOverlap("08:00", "09:00", "09:00", "10:00")).toBe(false);
    expect(rangesOverlap("08:00:00", "09:00:00", "08:15", "08:45")).toBe(true);
    const conflict = findScheduleOverlap(
      [{ id: "a", day_of_week: 1, start_time: "08:00", end_time: "09:00" }],
      { day_of_week: 1, start_time: "08:30", end_time: "09:30" },
    );
    expect(conflict?.id).toBe("a");
    expect(findScheduleOverlap(
      [{ id: "a", day_of_week: 1, start_time: "08:00", end_time: "09:00" }],
      { id: "a", day_of_week: 1, start_time: "08:00", end_time: "09:00" },
    )).toBeNull();
  });

  it("exige término depois do início", () => {
    expect(scheduleFormSchema.safeParse({
      subject_id: "3f1b6c2a-6a4e-4d8a-9c1e-1234567890ab",
      day_of_week: 1,
      start_time: "10:00",
      end_time: "09:00",
      room: "",
    }).success).toBe(false);
  });
});

describe("notificações e painel", () => {
  const tasks = [
    task({ id: "late", title: "Atrasada", due_at: "2026-10-21T15:00:00.000Z" }),
    task({ id: "soon", title: "Amanhã", due_at: "2026-10-23T15:00:00.000Z" }),
    task({ id: "far", title: "Longe", due_at: "2026-11-20T15:00:00.000Z" }),
    task({ id: "done", title: "Feita", due_at: "2026-10-21T15:00:00.000Z", status: "concluida", completed_at: "2026-10-22T12:00:00.000Z" }),
  ];
  const assessments = [
    assessment({ id: "exam", title: "Prova de física", type: "prova", exam_date: "2026-10-30T15:00:00.000Z" }),
    assessment({ id: "paper", title: "Relatório", type: "trabalho", exam_date: "2026-10-24T15:00:00.000Z" }),
    assessment({ id: "paper-done", title: "Entregue", type: "trabalho", exam_date: "2026-10-24T15:00:00.000Z", completed_at: "2026-10-20T15:00:00.000Z" }),
  ];
  const sessions = [
    session({ id: "study", title: "Revisão", scheduled_at: "2026-10-23T18:00:00.000Z" }),
  ];

  it("gera avisos reais e respeita preferências", () => {
    const drafts = deriveNotifications({ tasks, assessments, sessions, now: NOW });
    const types = drafts.map((draft) => draft.dedupe_key);
    expect(types).toContain("tarefa_atrasada:late");
    expect(types).toContain("prazo_proximo:soon");
    expect(types).not.toContain("prazo_proximo:far");
    expect(types).not.toContain("tarefa_atrasada:done");
    expect(types).toContain("prova_futura:exam");
    expect(types).toContain("trabalho_pendente:paper");
    expect(types).not.toContain("trabalho_pendente:paper-done");
    expect(types).toContain("sessao_agendada:study");

    const quiet = deriveNotifications({
      tasks,
      assessments,
      sessions,
      now: NOW,
      preferences: {
        user_id: "user-1",
        deadlines_enabled: false,
        overdue_enabled: false,
        exams_enabled: false,
        assignments_enabled: false,
        sessions_enabled: false,
        email_opt_in: false,
        notification_contact: "",
        created_at: "",
        updated_at: "",
      },
    });
    expect(quiet).toEqual([]);
  });

  it("não inventa progresso quando não há tarefas", () => {
    const empty = buildDashboard({ tasks: [], assessments: [], sessions: [], schedules: [], subjects: [], now: NOW });
    expect(empty.hasActivity).toBe(false);
    expect(empty.progress).toBeNull();
    expect(empty.pendingCount).toBe(0);

    const filled = buildDashboard({
      tasks,
      assessments,
      sessions,
      schedules: [],
      subjects: [math],
      now: NOW,
    });
    expect(filled.overdueCount).toBe(1);
    expect(filled.doneCount).toBe(1);
    expect(filled.progress).toEqual({ done: 1, total: 4 });
    expect(filled.weekly.reduce((sum, day) => sum + day.concluidas, 0)).toBe(1);
    expect(filled.upcomingExams).toHaveLength(1);
    expect(filled.upcomingAssignments).toHaveLength(1);
  });
});

describe("relatórios, calendário e matérias", () => {
  it("agrupa conclusões e tempo de estudo só com registros reais", () => {
    const report = buildReport({
      today: "2026-10-22",
      now: NOW,
      period: "esta_semana",
      subjects: [math],
      tasks: [
        task({
          id: "done",
          title: "Feita",
          status: "concluida",
          completed_at: "2026-10-22T18:00:00.000Z",
          created_at: "2026-10-20T12:00:00.000Z",
          category: "leitura",
          subject_id: "subject-math",
        }),
        task({ id: "open", title: "Aberta", subject_id: "subject-math", status: "pendente" }),
      ],
      sessions: [
        session({
          id: "studied",
          title: "Estudo",
          status: "concluida",
          scheduled_at: "2026-10-22T18:00:00.000Z",
          actual_duration_minutes: 40,
          duration_minutes: 50,
        }),
      ],
    });
    expect(report.completedTotal).toBe(1);
    expect(report.studyTotal).toBe(40);
    expect(report.overdue).toBe(0);
    expect(report.pendingBySubject).toEqual([{ materia: "Matemática", pendentes: 1 }]);
    expect(report.categories).toEqual([{ categoria: "leitura", quantidade: 1 }]);
    expect(report.completed.every((bucket) => typeof bucket.concluidas === "number")).toBe(true);
  });

  it("projeta aulas recorrentes só nos dias correspondentes", () => {
    const schedule: ScheduleRow = {
      id: "class-1",
      user_id: "user-1",
      subject_id: "subject-math",
      day_of_week: 4,
      start_time: "08:00:00",
      end_time: "09:00:00",
      room: "12",
      created_at: "2026-10-01T12:00:00.000Z",
      updated_at: "2026-10-01T12:00:00.000Z",
    };
    const items = buildCalendarItems({
      tasks: [task({ id: "due", title: "Entrega", due_at: "2026-10-22T18:00:00.000Z", subject_id: "subject-math" })],
      assessments: [],
      sessions: [],
      schedules: [schedule],
      subjects: [math],
      dates: ["2026-10-22", "2026-10-23"],
    });
    expect(items.filter((item) => item.kind === "aula")).toHaveLength(1);
    expect(items.find((item) => item.kind === "aula")?.title).toBe("Matemática");
    expect(items.find((item) => item.kind === "tarefa")?.date).toBe("2026-10-22");
  });

  it("resume a matéria sem apagar a contagem dos registros ligados", () => {
    const summary = summarizeSubject(
      "subject-math",
      [task({ id: "1", title: "A", subject_id: "subject-math", status: "pendente" })],
      [assessment({ id: "2", title: "B", type: "prova", subject_id: "subject-math" })],
      [session({ id: "3", title: "C", subject_id: "subject-math", status: "concluida", actual_duration_minutes: 25 })],
    );
    expect(summary).toEqual({ tasks: 1, pendingTasks: 1, assessments: 1, sessions: 1, studiedMinutes: 25 });
  });
});

describe("validação, paginação e caminhos", () => {
  it("exige letra e número no cadastro e gera o endereço interno a partir do nome", () => {
    expect(signupSchema.safeParse({
      fullName: "Ana Souza",
      password: "senha123",
      confirmPassword: "senha123",
    }).success).toBe(true);
    expect(signupSchema.safeParse({
      fullName: "A",
      password: "senha",
      confirmPassword: "outra",
    }).success).toBe(false);
    expect(internalEmail("Ana Souza")).toBe("ana.souza@conta.nexstudy.app");
    expect(internalEmail("João")).toBe(internalEmail("joao"));
    expect(internalEmail("...")).toBe("");
  });

  it("aceita login sem impor regra de complexidade", () => {
    expect(loginSchema.safeParse({ username: "Ana", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ username: "", password: "x" }).success).toBe(false);
  });

  it("pagina sem ultrapassar o fim da lista", () => {
    const page = paginate([1, 2, 3, 4, 5], 2, 2);
    expect(page).toMatchObject({ items: [3, 4], page: 2, pages: 3, total: 5 });
    expect(paginate([1], 9, 2).page).toBe(1);
  });

  it("bloqueia redirecionamento externo depois do login", () => {
    expect(safeNextPath("/tarefas")).toBe("/tarefas");
    expect(safeNextPath("https://evil.example")).toBe("/dashboard");
    expect(safeNextPath("//evil.example")).toBe("/dashboard");
    expect(safeNextPath("/perfil?ok=1")).toBe("/perfil?ok=1");
  });

  it("traduz erros de banco e autenticação", () => {
    expect(mapDbError({ message: "Este horário se sobrepõe a outra aula no mesmo dia." })).toMatch(/sobrepõe/);
    expect(mapDbError({ code: "42501", message: "permission denied" })).toMatch(/permissão/);
    expect(mapAuthError("Invalid login credentials")).toBe("Não foi possível entrar. Confira os dados e tente de novo.");
  });
});
