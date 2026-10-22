import type { Metadata } from "next";
import Link from "next/link";

import { PublicHeader } from "@/components/public-frame";

export const metadata: Metadata = {
  title: "NexStudy",
  description: "Sua vida escolar organizada em um só lugar.",
};

export default function HomePage() {
  return (
    <>
      <PublicHeader />
      <main id="conteudo" className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-xl flex-col justify-center px-4 py-16">
        <div className="rise">
          <p className="oe-kicker">Rotina escolar, sem planilha solta</p>
          <h1 className="oe-display">Sua vida escolar organizada em um só lugar</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted">
            Reúna tarefas, provas, grade, estudos e prazos. A interface é direta, e cada conta enxerga somente os próprios registros.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="oe-btn">Começar agora</Link>
            <Link href="/login" className="inline-flex h-11 items-center rounded-md border border-border bg-card px-4 text-sm font-semibold tracking-tight shadow-[inset_0_-2px_0_transparent] hover:shadow-[inset_0_-2px_0_var(--mark)]">Entrar</Link>
          </div>
        </div>
      </main>
    </>
  );
}
