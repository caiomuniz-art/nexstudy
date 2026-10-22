import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { NoticeEmailForm } from "@/components/notice-email";
import { PublicHeader } from "@/components/public-frame";
import { oneParam } from "@/lib/labels";
import { safeNextPath } from "@/lib/paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isVisitorValue, VISITOR_COOKIE } from "@/lib/visitor";

export const metadata: Metadata = { title: "Avisos" };

export default async function AvisosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) {
    const visitor = isVisitorValue((await cookies()).get(VISITOR_COOKIE)?.value);
    redirect(visitor ? "/apresentacao" : "/login");
  }
  return (
    <>
      <PublicHeader />
      <NoticeEmailForm nextPath={safeNextPath(oneParam(params.next))} />
    </>
  );
}
