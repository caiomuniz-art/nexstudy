import { redirect } from "next/navigation";

import { AssessmentsView } from "@/components/assessments-view";
import { defaultLocalDate, oneParam } from "@/lib/labels";
import { loadWorkspace } from "@/server/data";

export const metadata = { title: "Provas e trabalhos" };

export default async function AvaliacoesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const workspace = await loadWorkspace();
  if (workspace.status === "anonymous") redirect("/login");
  const ready = workspace.status === "ready";
  return (
    <AssessmentsView
      assessments={ready ? workspace.assessments : []}
      subjects={ready ? workspace.subjects : []}
      nowIso={new Date().toISOString()}
      nova={oneParam(params.nova) === "1"}
      editId={oneParam(params.editar)}
      presetDate={defaultLocalDate(oneParam(params.data) || null)}
      dbMessage={workspace.status === "error" ? workspace.message : null}
    />
  );
}
