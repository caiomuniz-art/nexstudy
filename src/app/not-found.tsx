import Link from "next/link";

import { PublicFooter, PublicHeader } from "@/components/public-frame";

export default function NotFound() {
  return (
    <>
      <PublicHeader />
      <main id="conteudo" className="mx-auto flex min-h-[50vh] max-w-xl flex-col justify-center px-4 py-16">
        <h1 className="text-3xl font-semibold">Página não encontrada</h1>
        <p className="mt-3 text-muted">O endereço não corresponde a nenhuma página do NexStudy.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/" className="oe-btn">Ir ao início</Link>
          <Link href="/dashboard" className="inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm">Abrir o painel</Link>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
