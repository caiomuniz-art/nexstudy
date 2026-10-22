import { redirect } from "next/navigation";

import { ReportsView } from "@/components/reports-view";
import { saoPauloToday } from "@/lib/dates";
import { loadWorkspace } from "@/server/data";

export const metadata = { title: "Relatórios" };

export default async function RelatoriosPage() {
  const workspace = await loadWorkspace();
  if (workspace.status === "anonymous") redirect("/login");
  const ready = workspace.status === "ready";
  return (
    <ReportsView
      tasks={ready ? workspace.tasks : []}
      sessions={ready ? workspace.sessions : []}
      subjects={ready ? workspace.subjects : []}
      today={saoPauloToday()}
      nowIso={new Date().toISOString()}
      dbMessage={workspace.status === "error" ? workspace.message : null}
    />
  );
}
