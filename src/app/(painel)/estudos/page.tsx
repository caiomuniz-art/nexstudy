import { redirect } from "next/navigation";

import { StudyView } from "@/components/study-view";
import { saoPauloToday } from "@/lib/dates";
import { defaultLocalDate, oneParam } from "@/lib/labels";
import { loadWorkspace } from "@/server/data";

export const metadata = { title: "Estudos" };

export default async function EstudosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const workspace = await loadWorkspace();
  if (workspace.status === "anonymous") redirect("/login");
  const ready = workspace.status === "ready";
  return (
    <StudyView
      sessions={ready ? workspace.sessions : []}
      subjects={ready ? workspace.subjects : []}
      today={saoPauloToday()}
      nova={oneParam(params.nova) === "1"}
      editId={oneParam(params.editar)}
      presetDate={defaultLocalDate(oneParam(params.data) || null)}
      dbMessage={workspace.status === "error" ? workspace.message : null}
    />
  );
}
