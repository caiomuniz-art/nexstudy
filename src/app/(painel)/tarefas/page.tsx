import { redirect } from "next/navigation";

import { TasksView } from "@/components/tasks-view";
import { loadWorkspace } from "@/server/data";

export const metadata = { title: "Tarefas" };

export default async function TarefasPage() {
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
      nova={false}
      editId=""
      presetDate=""
      truncated={ready ? workspace.truncated : false}
      dbMessage={workspace.status === "error" ? workspace.message : workspace.shell.dbMessage}
    />
  );
}
