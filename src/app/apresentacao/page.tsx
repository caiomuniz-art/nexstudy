import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Clock3,
  GraduationCap,
  Library,
  ListChecks,
  Shield,
} from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PublicFooter, PublicHeader } from "@/components/public-frame";
import { oneParam } from "@/lib/labels";
import { safeNextPath } from "@/lib/paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isVisitorValue, VISITOR_COOKIE } from "@/lib/visitor";

export const metadata: Metadata = {
  title: "Como funciona",
  description: "Funcionalidades e o caminho para organizar a rotina escolar no NexStudy.",
};

const features = [
  { href: "/tarefas", title: "Tarefas", text: "Prioridade, prazo, status e filtros que podem ser combinados.", icon: ListChecks },
  { href: "/avaliacoes", title: "Provas e trabalhos", text: "Conteúdo cobrado, preparação e data de entrega.", icon: GraduationCap },
  { href: "/horarios", title: "Grade horária", text: "A semana letiva, com aviso quando dois horários se cruzam.", icon: Clock3 },
  { href: "/calendario", title: "Calendário", text: "Mês, semana e dia da sua rotina.", icon: CalendarDays },
  { href: "/estudos", title: "Estudos", text: "Sessões, histórico e cronômetro enquanto a página está aberta.", icon: BookOpen },
  { href: "/materias", title: "Matérias", text: "Cor, professor, objetivos e o resumo dos registros.", icon: Library },
  { href: "/relatorios", title: "Relatórios", text: "Conclusões, atrasos e tempo de estudo.", icon: BarChart3 },
  { href: "/notificacoes", title: "Avisos", text: "Prazos, atrasos e sessões, com a leitura marcada.", icon: Shield },
];

const questions = [
  ["Preciso instalar alguma coisa?", "Não. O NexStudy abre no navegador, no computador e no celular."],
  ["Quem vê meus dados?", "Cada estudante acessa somente a própria conta. As políticas do banco recusam registros de outras pessoas."],
  ["O cronômetro continua se eu fechar a página?", "Não. A contagem vale enquanto esta página estiver aberta. Pausar, continuar e finalizar acontecem ali."],
  ["Como entro de novo?", "Use o mesmo nome escolhido no cadastro. Quem continua como visitante abre o painel sem conta."],
  ["Como excluo minha conta?", "Em Configurações, confirme a exclusão. O procedimento roda no servidor e apaga a conta e os dados ligados a ela."],
  ["Não tem uma conta?", "Cadastre-se. A conta fica salva para você entrar depois."],
];

export default async function ApresentacaoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const visitor = isVisitorValue((await cookies()).get(VISITOR_COOKIE)?.value);
  if (!user && !visitor) redirect("/");
  const panel = safeNextPath(oneParam(params.next));

  return (
    <>
      <PublicHeader />
      <main id="conteudo">
        <section className="mx-auto max-w-3xl px-4 py-16">
          <p className="oe-kicker">Depois da entrada</p>
          <h1 className="oe-display">A rotina, reunida</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted">
            O painel já pode ser aberto. Abaixo estão as partes do NexStudy e o caminho para organizar a semana.
          </p>
          <Link href={panel} className="oe-btn mt-8">Abrir o painel</Link>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Um painel só", "O dia, a semana e os prazos ficam no mesmo lugar."],
            ["Prioridade visível", "Alta, média e baixa, com o atraso identificado pelo horário."],
            ["Conta individual", "Cada estudante vê e edita somente a própria rotina. O visitante entra sem conta."],
          ].map(([title, text]) => (
            <article key={title} className="oe-card oe-pad">
              <h2 className="border-l-2 border-mark pl-3 font-semibold tracking-tight">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">{text}</p>
            </article>
          ))}
        </section>

        <section id="funcionalidades" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="oe-section">Funcionalidades</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Link key={feature.href} href={feature.href} className="oe-card oe-pad block border-l-2 border-l-transparent transition hover:border-l-mark">
                <feature.icon className="h-5 w-5 text-mark" aria-hidden />
                <h3 className="mt-4 font-semibold tracking-tight">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{feature.text}</p>
              </Link>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="oe-section">Como funciona</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["1. Entre", "Crie uma conta, entre com o nome escolhido ou continue como visitante. A conta fica salva para o próximo acesso."],
              ["2. Cadastre a rotina", "Matérias, grade, tarefas, provas e sessões de estudo."],
              ["3. Acompanhe a semana", "O painel, o calendário e os relatórios mostram a sua rotina."],
            ].map(([title, text]) => (
              <li key={title} className="oe-card oe-pad">
                <h3 className="border-l-2 border-mark pl-3 font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="oe-section">Para estudantes</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Menos chance de perder uma entrega ou uma prova.",
              "A semana letiva aparece junto com o que vence.",
              "O tempo estudado fica registrado quando a sessão é concluída.",
              "É possível revisar o que ainda não foi preparado.",
            ].map((item) => (
              <li key={item} className="rounded-md border border-border bg-card px-4 py-3 text-sm leading-6">{item}</li>
            ))}
          </ul>
        </section>

        <section id="faq" className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="oe-section">Perguntas frequentes</h2>
          <div className="mt-6 space-y-3">
            {questions.map(([question, answer]) => (
              <details key={question} className="oe-card px-4 py-3">
                <summary className="cursor-pointer font-medium">{question}</summary>
                <p className="mt-2 text-sm leading-6 text-muted">{answer}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-sm text-muted">
            Não tem uma conta? <Link href="/cadastro" className="font-medium text-accent">Cadastre-se.</Link>
          </p>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
