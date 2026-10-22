export function normalizeText(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

export function emptyToNull(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

export function firstName(fullName: string | null | undefined) {
  const trimmed = fullName?.trim() ?? "";
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? "";
}

export function formatMinutes(total: number) {
  const safe = Math.max(0, Math.round(total));
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

export function subjectName(subjects: { id: string; name: string }[], subjectId: string | null) {
  if (!subjectId) return "Sem matéria";
  return subjects.find((subject) => subject.id === subjectId)?.name ?? "Matéria removida";
}

export function subjectColor(subjects: { id: string; color: string }[], subjectId: string | null) {
  return subjects.find((subject) => subject.id === subjectId)?.color ?? "#00c2f2";
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
