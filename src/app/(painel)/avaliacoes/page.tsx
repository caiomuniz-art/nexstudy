import { redirect } from "next/navigation";

import { AssessmentsView } from "@/components/assessments-view";
import { loadWorkspace } from "@/server/data";

export const metadata = { title: "Provas e trabalhos" };

export default async function AvaliacoesPage() {
  const workspace = await loadWorkspace();
  if (workspace.status === "anonymous") redirect("/login");
  const ready = workspace.status === "ready";
  return (
    <AssessmentsView
      assessments={ready ? workspace.assessments : []}
      subjects={ready ? workspace.subjects : []}
      nowIso={new Date().toISOString()}
      nova={false}
      editId=""
      presetDate=""
      dbMessage={workspace.status === "error" ? workspace.message : null}
    />
  );
}
