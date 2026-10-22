import { redirect } from "next/navigation";

import { ScheduleView } from "@/components/schedule-view";
import { oneParam } from "@/lib/labels";
import { loadWorkspace } from "@/server/data";

export const metadata = { title: "Grade horária" };

export default async function HorariosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const workspace = await loadWorkspace();
  if (workspace.status === "anonymous") redirect("/login");
  const ready = workspace.status === "ready";
  const day = Number(oneParam(params.dia));
  return (
    <ScheduleView
      schedules={ready ? workspace.schedules : []}
      subjects={ready ? workspace.subjects : []}
      nova={oneParam(params.nova) === "1"}
      editId={oneParam(params.editar)}
      presetDay={Number.isInteger(day) && day >= 0 && day <= 6 ? day : 1}
      dbMessage={workspace.status === "error" ? workspace.message : null}
    />
  );
}
