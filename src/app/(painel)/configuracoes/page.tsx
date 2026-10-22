import { redirect } from "next/navigation";

import { SettingsView } from "@/components/settings-view";
import { oneParam } from "@/lib/labels";
import { loadWorkspace } from "@/server/data";

export const metadata = { title: "Configurações" };

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const workspace = await loadWorkspace();
  if (workspace.status === "anonymous") redirect("/login");
  return (
    <SettingsView
      configured={workspace.status !== "unconfigured"}
      theme={workspace.shell.theme}
      tasksView={workspace.shell.tasksView}
      density={workspace.shell.density}
      recovery={oneParam(params.recuperacao) === "1"}
      dbMessage={workspace.status === "error" ? workspace.message : null}
    />
  );
}
