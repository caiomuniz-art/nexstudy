export function paginate<T>(items: T[], page: number, pageSize: number) {
  const size = Math.max(1, pageSize);
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, Math.trunc(page) || 1), pages);
  const start = (current - 1) * size;
  return {
    items: items.slice(start, start + size),
    page: current,
    pages,
    total,
  };
}
