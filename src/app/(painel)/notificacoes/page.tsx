import { redirect } from "next/navigation";

import { NotificationsView } from "@/components/notifications-view";
import { loadWorkspace } from "@/server/data";

export const metadata = { title: "Notificações" };

export default async function NotificacoesPage() {
  const workspace = await loadWorkspace();
  if (workspace.status === "anonymous") redirect("/login");
  return (
    <NotificationsView
      notifications={workspace.status === "ready" ? workspace.notifications : []}
      preferences={workspace.status === "ready" ? workspace.notificationPreferences : null}
      dbMessage={workspace.status === "error" ? workspace.message : workspace.shell.dbMessage}
    />
  );
}
