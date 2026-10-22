import { redirect } from "next/navigation";

import { ProfileView } from "@/components/profile-view";
import { loadWorkspace } from "@/server/data";

export const metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const workspace = await loadWorkspace();
  if (workspace.status === "anonymous") redirect("/login");
  return (
    <ProfileView
      fullName={workspace.shell.fullName}
      email={workspace.shell.email}
      school={workspace.shell.school ?? ""}
      grade={workspace.shell.grade ?? ""}
      className={workspace.shell.className ?? ""}
      avatarUrl={workspace.shell.avatarUrl}
      dbMessage={workspace.status === "error" ? workspace.message : null}
    />
  );
}
