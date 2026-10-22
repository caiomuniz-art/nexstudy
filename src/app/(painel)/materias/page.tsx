import { redirect } from "next/navigation";

import { SubjectsView } from "@/components/subjects-view";
import { oneParam } from "@/lib/labels";
import { loadWorkspace } from "@/server/data";

export const metadata = { title: "Matérias" };

export default async function MateriasPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const workspace = await loadWorkspace();
  if (workspace.status === "anonymous") redirect("/login");
  const ready = workspace.status === "ready";
  return (
    <SubjectsView
      subjects={ready ? workspace.subjects : []}
      tasks={ready ? workspace.tasks : []}
      assessments={ready ? workspace.assessments : []}
      sessions={ready ? workspace.sessions : []}
      nova={oneParam(params.nova) === "1"}
      editId={oneParam(params.editar)}
      dbMessage={workspace.status === "error" ? workspace.message : null}
    />
  );
}
