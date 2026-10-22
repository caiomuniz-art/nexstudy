import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PRIVATE_ROUTES } from "@/types/domain";

const root = process.cwd();

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (entry === "node_modules" || entry === ".next") return [];
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

describe("segurança do projeto", () => {
  it("não referencia chave de administração no código da aplicação", () => {
    const files = walk(join(root, "src")).filter((file) => /\.(ts|tsx)$/.test(file) && !file.endsWith(".test.ts"));
    const banned = ["SUPABASE_SERVICE_ROLE", "service_role", "SERVICE_ROLE_KEY"];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const token of banned) {
        expect(source.includes(token), `${file} contém ${token}`).toBe(false);
      }
    }
  });

  it("ativa RLS e políticas de dono em todas as tabelas privadas", () => {
    const sql = readdirSync(join(root, "supabase/migrations"))
      .filter((file) => file.endsWith(".sql"))
      .map((file) => readFileSync(join(root, "supabase/migrations", file), "utf8"))
      .join("\n");
    const tables = [
      "profiles",
      "user_preferences",
      "notification_preferences",
      "subjects",
      "tasks",
      "assessments",
      "class_schedules",
      "study_sessions",
      "notifications",
    ];
    for (const table of tables) {
      expect(sql).toContain(`alter table public.${table} enable row level security`);
      expect(sql).toContain(`create policy ${table}_select`);
      if (table !== "profiles") {
        expect(sql).toContain(`create policy ${table}_delete`);
      }
      expect(sql).toContain("auth.uid()");
    }
    expect(sql).toContain("Este horário se sobrepõe a outra aula no mesmo dia.");
    expect(sql).toContain("on delete set null");
    expect(sql).toContain("delete_own_account");
    expect(sql).not.toContain("service_role");
  });

  it("não escreve usuário nem senha nos blocos de entrada e de cadastro", () => {
    const source = readFileSync(join(root, "src/components/auth-forms.tsx"), "utf8");
    const login = source.slice(source.indexOf("export function LoginForm"), source.indexOf("export function SignupForm"));
    const signup = source.slice(source.indexOf("export function SignupForm"), source.indexOf("export function RecoveryForm"));
    for (const block of [login, signup]) {
      expect(block.toLowerCase()).not.toMatch(/usuário|usuario|senha/);
    }
  });

  it("cobre as rotas privadas pedidas", () => {
    const expected = [
      "/dashboard",
      "/tarefas",
      "/avaliacoes",
      "/horarios",
      "/calendario",
      "/estudos",
      "/materias",
      "/relatorios",
      "/notificacoes",
      "/perfil",
      "/configuracoes",
    ];
    expect(PRIVATE_ROUTES.map((route) => route.href)).toEqual(expected);
  });
});
