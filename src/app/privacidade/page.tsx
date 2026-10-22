import type { Metadata } from "next";
import Link from "next/link";

import { PublicFooter, PublicHeader } from "@/components/public-frame";

export const metadata: Metadata = { title: "Privacidade" };

export default function PrivacyPage() {
  return (
    <>
      <PublicHeader />
      <main id="conteudo" className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-semibold">Política de privacidade</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-muted">
          <p>O NexStudy guarda os dados da conta em um banco com acesso individual. A chave de administração não fica no navegador.</p>
          <p>Coletamos o nome, o e-mail de acesso e, se você informar, escola, série, turma e foto. Também ficam salvos matérias, tarefas, avaliações, horários, sessões de estudo, preferências e avisos internos.</p>
          <p>Esses registros servem para mostrar sua rotina. Não há venda de dados nesta aplicação e não há envio de e-mail de aviso implementado. A opção de interesse por e-mail fica apenas registrada para uma integração futura.</p>
          <p>Cada estudante só consulta e altera os próprios dados, por meio das políticas de linha do banco. A exclusão da conta, em Configurações, pede a confirmação EXCLUIR e chama um procedimento no servidor.</p>
          <p>O cronômetro não continua depois que o navegador fecha. A sessão só é gravada quando você finaliza.</p>
          <p>Para exercer acesso ou exclusão, use as telas de perfil e configurações.</p>
        </div>
        <Link href="/" className="mt-8 inline-flex text-sm text-accent">Voltar ao início</Link>
      </main>
      <PublicFooter />
    </>
  );
}
