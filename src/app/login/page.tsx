import type { Metadata } from "next";

import { LoginForm } from "@/components/auth-forms";
import { PublicHeader } from "@/components/public-frame";
import { safeNextPath } from "@/lib/paths";
import { oneParam } from "@/lib/labels";

export const metadata: Metadata = { title: "Entrar" };

const ERRORS: Record<string, string> = {
  confirmacao: "Não foi possível confirmar o acesso. Solicite um novo link.",
  configuracao: "Não foi possível concluir o acesso. Tente de novo.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(oneParam(params.next) || "/dashboard");
  const erro = oneParam(params.erro);
  return (
    <>
      <PublicHeader />
      <LoginForm nextPath={nextPath} initialError={ERRORS[erro] ?? ""} />
    </>
  );
}
