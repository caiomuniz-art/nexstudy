"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { VISITOR_COOKIE } from "@/lib/visitor";

export default function VisitantePage() {
  const router = useRouter();
  useEffect(() => {
    document.cookie = `${VISITOR_COOKIE}=1; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    router.replace("/dashboard");
  }, [router]);
  return null;
}
