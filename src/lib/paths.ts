import { PRIVATE_ROUTES } from "@/types/domain";

export function safeNextPath(value: string | null | undefined) {
  if (!value) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) {
    return "/dashboard";
  }
  const path = value.split("?")[0] ?? value;
  const allowed = PRIVATE_ROUTES.some((route) => path === route.href || path.startsWith(`${route.href}/`));
  return allowed ? value : "/dashboard";
}

export function isPrivatePath(pathname: string) {
  return PRIVATE_ROUTES.some((route) => pathname === route.href || pathname.startsWith(`${route.href}/`));
}
