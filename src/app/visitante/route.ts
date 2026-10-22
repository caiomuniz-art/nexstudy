import { NextResponse } from "next/server";

import { VISITOR_COOKIE } from "@/lib/visitor";

export function GET() {
  const response = new NextResponse(null, {
    status: 307,
    headers: { Location: "/apresentacao" },
  });
  response.cookies.set(VISITOR_COOKIE, "1", {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
