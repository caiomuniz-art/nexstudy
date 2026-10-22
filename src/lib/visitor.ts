export const VISITOR_COOKIE = "oe-visitante";

export function isVisitorValue(value: string | undefined) {
  return value === "1";
}
