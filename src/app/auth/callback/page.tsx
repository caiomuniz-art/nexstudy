"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { safeNextPath } from "@/lib/paths";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export default function AuthCallbackPage() {
  const router = useRouter();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const next = safeNextPath(params.get("next"));
    if (!code) {
      router.replace("/login?erro=confirmacao");
      return;
    }
    const supabase = createBrowserSupabase();
    if (!supabase) {
      router.replace("/login?erro=configuracao");
      return;
    }
    void supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      router.replace(error ? "/login?erro=confirmacao" : next);
    });
  }, [router]);
  return null;
}
