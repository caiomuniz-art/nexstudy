import { redirect } from "next/navigation";

import { DashboardView } from "@/components/dashboard-view";
import { Alert, PageHeader } from "@/components/ui";
import { formatLongCivil, salutation } from "@/lib/dates";
import { loadWorkspace } from "@/server/data";

export const metadata = { title: "Painel" };

export default async function DashboardPage() {
  const workspace = await loadWorkspace();
  if (workspace.status === "anonymous") redirect("/login");
  if (workspace.status === "error") {
    const now = new Date();
    const today = formatLongCivil(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now));
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <PageHeader title={salutation(now)} description={today} />
        <Alert tone="error">{workspace.message}</Alert>
      </div>
    );
  }

  const ready = workspace.status === "ready";
  return (
    <DashboardView
      configured={ready}
      tasks={ready ? workspace.tasks : []}
      assessments={ready ? workspace.assessments : []}
      sessions={ready ? workspace.sessions : []}
      schedules={ready ? workspace.schedules : []}
      subjects={ready ? workspace.subjects : []}
      fullName={workspace.shell.fullName}
      school={workspace.shell.school ?? ""}
      grade={workspace.shell.grade ?? ""}
      className={workspace.shell.className ?? ""}
    />
  );
}
