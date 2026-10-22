export function timeToMinutes(value: string) {
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function rangesOverlap(startA: string, endA: string, startB: string, endB: string) {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);
  if (aStart === null || aEnd === null || bStart === null || bEnd === null) return false;
  return aStart < bEnd && bStart < aEnd;
}

export function findScheduleOverlap<T extends { id?: string; day_of_week: number; start_time: string; end_time: string }>(
  schedules: T[],
  candidate: { id?: string; day_of_week: number; start_time: string; end_time: string },
) {
  return (
    schedules.find(
      (schedule) =>
        schedule.id !== candidate.id &&
        schedule.day_of_week === candidate.day_of_week &&
        rangesOverlap(schedule.start_time, schedule.end_time, candidate.start_time, candidate.end_time),
    ) ?? null
  );
}
