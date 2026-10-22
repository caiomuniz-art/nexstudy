import { redirect } from "next/navigation";

import { CalendarView } from "@/components/calendar-view";
import { saoPauloToday } from "@/lib/dates";
import { loadWorkspace } from "@/server/data";

export const metadata = { title: "Calendário" };

export default async function CalendarioPage() {
  const workspace = await loadWorkspace();
  if (workspace.status === "anonymous") redirect("/login");
  const ready = workspace.status === "ready";
  return (
    <CalendarView
      tasks={ready ? workspace.tasks : []}
      assessments={ready ? workspace.assessments : []}
      sessions={ready ? workspace.sessions : []}
      schedules={ready ? workspace.schedules : []}
      subjects={ready ? workspace.subjects : []}
      today={saoPauloToday()}
    />
  );
}
