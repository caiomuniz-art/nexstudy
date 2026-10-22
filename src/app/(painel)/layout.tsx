import { redirect } from "next/navigation";

import { AppShell } from "@/components/shell";
import { loadWorkspace } from "@/server/data";

export const dynamic = "force-dynamic";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const workspace = await loadWorkspace();
  if (workspace.status === "anonymous") redirect("/login");
  return <AppShell shell={workspace.shell}>{children}</AppShell>;
}
