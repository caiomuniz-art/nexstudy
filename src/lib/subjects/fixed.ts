export const FIXED_SUBJECTS = [
  { id: "a1000000-0000-4000-8000-000000000001", name: "Artes", color: "#e11d48" },
  { id: "a1000000-0000-4000-8000-000000000002", name: "Biologia", color: "#00b3a4" },
  { id: "a1000000-0000-4000-8000-000000000003", name: "História", color: "#f59e0b" },
  { id: "a1000000-0000-4000-8000-000000000004", name: "Informática", color: "#4f46e5" },
  { id: "a1000000-0000-4000-8000-000000000005", name: "Inglês", color: "#0096ff" },
  { id: "a1000000-0000-4000-8000-000000000006", name: "Português", color: "#003878" },
  { id: "a1000000-0000-4000-8000-000000000007", name: "Matemática", color: "#00c2f2" },
  { id: "a1000000-0000-4000-8000-000000000008", name: "Filosofia", color: "#8b5cf6" },
  { id: "a1000000-0000-4000-8000-000000000009", name: "Química", color: "#00c2f2" },
] as const;

export type FixedSubject = (typeof FIXED_SUBJECTS)[number];
