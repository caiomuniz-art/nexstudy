import { NextResponse } from "next/server";

import { safeNextPath } from "@/lib/paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login?erro=confirmacao", url.origin));
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/login?erro=configuracao", url.origin));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?erro=confirmacao", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
