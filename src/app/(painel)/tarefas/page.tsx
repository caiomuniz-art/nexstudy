import { redirect } from "next/navigation";

import { TasksView } from "@/components/tasks-view";
import { defaultLocalDate, oneParam } from "@/lib/labels";
import { loadWorkspace } from "@/server/data";

export const metadata = { title: "Tarefas" };

export default async function TarefasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const workspace = await loadWorkspace();
  if (workspace.status === "anonymous") redirect("/login");
  const ready = workspace.status === "ready";
  return (
    <TasksView
      tasks={ready ? workspace.tasks : []}
      subjects={ready ? workspace.subjects : []}
      configured={workspace.status !== "unconfigured"}
      theme={workspace.shell.theme}
      density={workspace.shell.density}
      initialView={workspace.shell.tasksView}
      nowIso={new Date().toISOString()}
      nova={oneParam(params.nova) === "1"}
      editId={oneParam(params.editar)}
      presetDate={defaultLocalDate(oneParam(params.data) || null)}
      truncated={ready ? workspace.truncated : false}
      dbMessage={workspace.status === "error" ? workspace.message : workspace.shell.dbMessage}
    />
  );
}
