import { civilDateInSaoPaulo } from "@/lib/dates";
import { normalizeText } from "@/lib/text";
import { PRIORITY_RANK, type DueFilter, type TaskRow, type TaskSort } from "@/types/domain";

export type TaskQuery = {
  search: string;
  subjectId: string;
  status: string;
  priority: string;
  category: string;
  due: DueFilter;
  sort: TaskSort;
};

export const EMPTY_TASK_QUERY: TaskQuery = {
  search: "",
  subjectId: "",
  status: "",
  priority: "",
  category: "",
  due: "todas",
  sort: "entrega_asc",
};

export function taskTiming(task: TaskRow, now: Date) {
  if (!task.due_at) return { overdue: false, today: false, future: false, undated: true };
  const due = new Date(task.due_at);
  const today = civilDateInSaoPaulo(now);
  const dueCivil = civilDateInSaoPaulo(due);
  return {
    overdue: task.status !== "concluida" && due.getTime() < now.getTime(),
    today: dueCivil === today,
    future: Boolean(dueCivil && today && dueCivil > today),
    undated: false,
  };
}

export function filterTasks(tasks: TaskRow[], query: TaskQuery, now: Date) {
  const search = normalizeText(query.search);
  const filtered = tasks.filter((task) => {
    if (search) {
      const haystack = normalizeText(`${task.title} ${task.description ?? ""} ${task.notes ?? ""}`);
      if (!haystack.includes(search)) return false;
    }
    if (query.subjectId && task.subject_id !== query.subjectId) return false;
    if (query.status && task.status !== query.status) return false;
    if (query.priority && task.priority !== query.priority) return false;
    if (query.category && task.category !== query.category) return false;
    const timing = taskTiming(task, now);
    if (query.due === "atrasadas" && !timing.overdue) return false;
    if (query.due === "hoje" && !timing.today) return false;
    if (query.due === "futuras" && !timing.future) return false;
    if (query.due === "sem_prazo" && !timing.undated) return false;
    return true;
  });

  return filtered.sort((a, b) => compareTasks(a, b, query.sort));
}

function compareTasks(a: TaskRow, b: TaskRow, sort: TaskSort) {
  if (sort === "prioridade_desc" || sort === "prioridade_asc") {
    const direction = sort === "prioridade_desc" ? 1 : -1;
    const byPriority = (PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]) * direction;
    if (byPriority !== 0) return byPriority;
  }
  if (sort === "criacao_desc") return b.created_at.localeCompare(a.created_at);
  const direction = sort === "entrega_desc" ? -1 : 1;
  if (!a.due_at && !b.due_at) return b.created_at.localeCompare(a.created_at);
  if (!a.due_at) return 1;
  if (!b.due_at) return -1;
  return a.due_at.localeCompare(b.due_at) * direction;
}

export function taskCounts(tasks: TaskRow[], now: Date) {
  return {
    todas: tasks.length,
    atrasadas: tasks.filter((task) => taskTiming(task, now).overdue).length,
    hoje: tasks.filter((task) => taskTiming(task, now).today).length,
    futuras: tasks.filter((task) => taskTiming(task, now).future).length,
    sem_prazo: tasks.filter((task) => taskTiming(task, now).undated).length,
  };
}
