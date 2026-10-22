import { redirect } from "next/navigation";

import { ScheduleView } from "@/components/schedule-view";
import { loadWorkspace } from "@/server/data";

export const metadata = { title: "Grade horária" };

export default async function HorariosPage() {
  const workspace = await loadWorkspace();
  if (workspace.status === "anonymous") redirect("/login");
  const ready = workspace.status === "ready";
  return (
    <ScheduleView
      schedules={ready ? workspace.schedules : []}
      subjects={ready ? workspace.subjects : []}
      nova={false}
      editId=""
      presetDay={1}
      dbMessage={workspace.status === "error" ? workspace.message : null}
    />
  );
}
