import { redirect } from "next/navigation";

import { StudyView } from "@/components/study-view";
import { saoPauloToday } from "@/lib/dates";
import { loadWorkspace } from "@/server/data";

export const metadata = { title: "Estudos" };

export default async function EstudosPage() {
  const workspace = await loadWorkspace();
  if (workspace.status === "anonymous") redirect("/login");
  const ready = workspace.status === "ready";
  return (
    <StudyView
      sessions={ready ? workspace.sessions : []}
      subjects={ready ? workspace.subjects : []}
      today={saoPauloToday()}
      nova={false}
      editId=""
      presetDate=""
      dbMessage={workspace.status === "error" ? workspace.message : null}
    />
  );
}
