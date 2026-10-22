import { redirect } from "next/navigation";

import { SubjectsView } from "@/components/subjects-view";
import { loadWorkspace } from "@/server/data";

export const metadata = { title: "Matérias" };

export default async function MateriasPage() {
  const workspace = await loadWorkspace();
  if (workspace.status === "anonymous") redirect("/login");
  const ready = workspace.status === "ready";
  return (
    <SubjectsView
      subjects={ready ? workspace.subjects : []}
      tasks={ready ? workspace.tasks : []}
      assessments={ready ? workspace.assessments : []}
      sessions={ready ? workspace.sessions : []}
      nova={false}
      editId=""
      dbMessage={workspace.status === "error" ? workspace.message : null}
    />
  );
}
