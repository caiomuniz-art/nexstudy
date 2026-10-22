import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabasePublicEnv } from "@/lib/env";
import { isPrivatePath, safeNextPath } from "@/lib/paths";
import { isVisitorValue, VISITOR_COOKIE } from "@/lib/visitor";

const AUTH_PATHS = ["/login", "/cadastro", "/recuperar-senha"];

export async function updateSession(request: NextRequest) {
  const env = getSupabasePublicEnv();
  if (!env) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let user: { id: string } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  const pathname = request.nextUrl.pathname;
  const isAuthPage = AUTH_PATHS.some((path) => pathname === path);

  const visitor = isVisitorValue(request.cookies.get(VISITOR_COOKIE)?.value);
  if (isPrivatePath(pathname) && !user && !visitor) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return redirectWithSession(url, response);
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = safeNextPath("/dashboard");
    url.search = "";
    return redirectWithSession(url, response);
  }

  return response;
}

function redirectWithSession(url: URL, response: NextResponse) {
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });
  return redirect;
}
