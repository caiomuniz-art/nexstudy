export const APP_TIME_ZONE = "America/Sao_Paulo";

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function getZonedParts(date: Date, timeZone = APP_TIME_ZONE): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  let hour = Number(parts.hour);
  if (hour === 24) hour = 0;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour,
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

export function civilFromParts(parts: Pick<ZonedParts, "year" | "month" | "day">) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function saoPauloToday(now = new Date()) {
  return civilFromParts(getZonedParts(now));
}

export function civilDateInSaoPaulo(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  return civilFromParts(getZonedParts(date));
}

export function addCivilDays(civil: string, days: number) {
  const [year, month, day] = civil.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return utc.toISOString().slice(0, 10);
}

export function civilWeekday(civil: string) {
  const [year, month, day] = civil.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function startOfWeek(civil: string) {
  const weekday = civilWeekday(civil);
  const delta = weekday === 0 ? -6 : 1 - weekday;
  return addCivilDays(civil, delta);
}

export function timeZoneOffsetMinutes(date: Date, timeZone = APP_TIME_ZONE) {
  const parts = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return Math.round((asUtc - date.getTime()) / 60000);
}

export function saoPauloLocalToIso(local: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;

  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  let utc = wallAsUtc;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const offset = timeZoneOffsetMinutes(new Date(utc));
    utc = wallAsUtc - offset * 60_000;
  }

  const date = new Date(utc);
  const parts = getZonedParts(date);
  if (
    parts.year !== year ||
    parts.month !== month ||
    parts.day !== day ||
    parts.hour !== hour ||
    parts.minute !== minute
  ) {
    return null;
  }
  return date.toISOString();
}

export function isoToSaoPauloLocal(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = getZonedParts(date);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function formatCivilBr(civil: string) {
  const [year, month, day] = civil.split("-");
  if (!year || !month || !day) return civil;
  return `${day}/${month}/${year}`;
}

export function formatTimeLabel(value: string | null | undefined) {
  if (!value) return null;
  const match = /^(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[1]}:${match[2]}` : null;
}

export function formatDateTimeBr(iso: string | null | undefined) {
  if (!iso) return "Sem data";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatLongCivil(civil: string) {
  const [year, month, day] = civil.split("-").map(Number);
  const instant = new Date(Date.UTC(year, month - 1, day, 15, 0, 0));
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(instant);
}

export function salutation(now = new Date()) {
  const hour = getZonedParts(now).hour;
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function relativeCivilLabel(civil: string, today: string) {
  if (civil === today) return "Hoje";
  if (civil === addCivilDays(today, 1)) return "Amanhã";
  if (civil === addCivilDays(today, -1)) return "Ontem";
  return formatCivilBr(civil);
}

export function monthMatrix(anchor: string) {
  const month = Number(anchor.slice(5, 7));
  const first = `${anchor.slice(0, 7)}-01`;
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => {
    const date = addCivilDays(start, index);
    return { date, inMonth: Number(date.slice(5, 7)) === month };
  });
}

export function shiftAnchor(anchor: string, view: "mes" | "semana" | "dia", direction: -1 | 1) {
  if (view === "mes") {
    const [year, month] = anchor.split("-").map(Number);
    const next = new Date(Date.UTC(year, month - 1 + direction, 1));
    return next.toISOString().slice(0, 10);
  }
  if (view === "semana") return addCivilDays(anchor, direction * 7);
  return addCivilDays(anchor, direction);
}

export function visibleDates(anchor: string, view: "mes" | "semana" | "dia") {
  if (view === "dia") return [anchor];
  if (view === "semana") {
    const start = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, index) => addCivilDays(start, index));
  }
  return monthMatrix(anchor).map((cell) => cell.date);
}

export function periodRange(period: "esta_semana" | "semana_passada" | "este_mes" | "ultimos_30" | "este_ano", today: string) {
  if (period === "esta_semana") {
    const start = startOfWeek(today);
    return { start, end: addCivilDays(start, 6) };
  }
  if (period === "semana_passada") {
    const start = addCivilDays(startOfWeek(today), -7);
    return { start, end: addCivilDays(start, 6) };
  }
  if (period === "este_mes") return { start: `${today.slice(0, 7)}-01`, end: today };
  if (period === "ultimos_30") return { start: addCivilDays(today, -29), end: today };
  return { start: `${today.slice(0, 4)}-01-01`, end: today };
}

export function enumerateBuckets(start: string, end: string, kind: "day" | "week") {
  if (!start || !end || start > end) return [];
  if (kind === "day") {
    const buckets: { key: string; label: string }[] = [];
    for (let date = start; date <= end && buckets.length < 400; date = addCivilDays(date, 1)) {
      buckets.push({ key: date, label: `${date.slice(8, 10)}/${date.slice(5, 7)}` });
    }
    return buckets;
  }

  const buckets: { key: string; label: string }[] = [];
  let cursor = startOfWeek(start);
  const last = startOfWeek(end);
  while (cursor <= last && buckets.length < 80) {
    buckets.push({ key: cursor, label: formatCivilBr(cursor).slice(0, 5) });
    cursor = addCivilDays(cursor, 7);
  }
  return buckets;
}
