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
import Link from "next/link";

import { Logo } from "@/components/logo";
import { PublicFooter, PublicHeader } from "@/components/public-frame";
import { StudyArt, type StudyScene } from "@/components/study-art";

export const metadata: Metadata = {
  title: "NexStudy",
  description: "Sua vida escolar organizada em um só lugar.",
};

const features = [
  { href: "/tarefas", title: "Tarefas", text: "Prioridade, prazo, status e filtros combináveis.", icon: ListChecks },
  { href: "/avaliacoes", title: "Provas e trabalhos", text: "Conteúdo, preparação e entregas.", icon: GraduationCap },
  { href: "/horarios", title: "Grade horária", text: "Semana letiva com aviso de sobreposição.", icon: Clock3 },
  { href: "/calendario", title: "Calendário", text: "Mês, semana e dia da sua rotina.", icon: CalendarDays },
  { href: "/estudos", title: "Estudos", text: "Sessões, histórico e cronômetro enquanto a página está aberta.", icon: BookOpen },
  { href: "/materias", title: "Matérias", text: "Cor, professor, objetivos e resumo dos registros.", icon: Library },
  { href: "/relatorios", title: "Relatórios", text: "Conclusões, atrasos e tempo de estudo.", icon: BarChart3 },
  { href: "/notificacoes", title: "Avisos", text: "Prazos, atrasos e sessões, com leitura marcada.", icon: Shield },
];

const questions = [
  ["Preciso instalar alguma coisa?", "Não. O NexStudy abre no navegador, no computador e no celular."],
  ["Quem vê meus dados?", "Cada estudante acessa somente a própria conta. As políticas do banco recusam registros de outras pessoas."],
  ["O cronômetro continua se eu fechar a página?", "Não. A contagem vale enquanto esta página estiver aberta. Pausar, continuar e finalizar acontecem ali."],
  ["Como recupero a senha?", "Na tela Entrar, use Esqueci a senha. O link chega no e-mail da conta."],
  ["Como excluo minha conta?", "Em Configurações, confirme a exclusão. O procedimento roda no servidor e apaga a conta e os dados ligados a ela."],
];

export default function HomePage() {
  return (
    <>
      <PublicHeader />
      <main id="conteudo">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="rise">
            <p className="oe-kicker">Rotina escolar, sem planilha solta</p>
            <h1 className="oe-display">Sua vida escolar organizada em um só lugar</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted">
              Reúna tarefas, provas, grade, estudos e prazos. A interface é direta, e cada conta enxerga somente os próprios registros.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cadastro" className="oe-btn">Começar agora</Link>
              <Link href="/login" className="inline-flex h-11 items-center rounded-md border border-border bg-card px-4 text-sm font-semibold tracking-tight shadow-[inset_0_-2px_0_transparent] hover:shadow-[inset_0_-2px_0_var(--mark)]">Entrar</Link>
            </div>
          </div>
          <div className="oe-card overflow-hidden">
            <div className="flex items-center border-b border-white/10 bg-sidebar px-4 py-3 text-white">
              <Logo size={28} className="text-white" />
            </div>
            <div className="grid sm:grid-cols-[9.5rem_1fr]">
              <div className="hidden bg-sidebar p-3 text-sm text-sidebar-muted sm:block">
                <p className="rounded-md bg-white/10 px-3 py-2 font-semibold text-white shadow-[inset_4px_0_0_var(--mark)]">Painel</p>
                <p className="mt-1 rounded-md px-3 py-2">Tarefas</p>
                <p className="rounded-md px-3 py-2">Calendário</p>
                <p className="rounded-md px-3 py-2">Estudos</p>
              </div>
              <div className="space-y-4 p-5">
                <p className="oe-kicker">Painel</p>
                <ul className="divide-y divide-border text-sm">
                  {["Tarefas do dia", "Próxima prova", "Sessão de estudo"].map((item) => (
                    <li key={item} className="flex items-center gap-3 py-3">
                      <span className="h-4 w-0.5 rounded-full bg-mark" aria-hidden />
                      <span className="font-medium tracking-tight">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-8 sm:grid-cols-3" aria-label="Composições do estudo">
          {(
            [
              ["estudo", "Estudo", "Caderno, relógio e lista de tarefas."],
              ["calendario", "Calendário", "A grade do mês com um dia marcado."],
              ["horario", "Horário", "Os blocos da semana letiva."],
            ] as const satisfies ReadonlyArray<readonly [StudyScene, string, string]>
          ).map(([scene, title, text]) => (
            <figure key={scene} className="oe-card overflow-hidden p-3">
              <StudyArt scene={scene} />
              <figcaption className="px-2 pb-1 pt-3">
                <h2 className="border-l-4 border-mark pl-3 text-base font-extrabold tracking-tight">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
              </figcaption>
            </figure>
          ))}
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-4 sm:grid-cols-3">
          {[
            ["Um painel só", "O dia, a semana e os prazos ficam no mesmo lugar."],
            ["Prioridade visível", "Alta, média e baixa, com atraso identificado pelo horário."],
            ["Conta individual", "Cada estudante vê e edita somente a própria rotina."],
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
              ["1. Crie sua conta", "Nome, e-mail e senha. Se a confirmação por e-mail estiver ativa, abra o link antes de entrar."],
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
              "Menos chance de perder entrega e prova.",
              "A semana letiva aparece junto com o que vence.",
              "O tempo estudado fica registrado quando a sessão é concluída.",
              "Dá para revisar o que ainda não foi preparado.",
            ].map((item) => (
              <li key={item} className="rounded-md border border-border bg-card px-4 py-3 text-sm leading-6">{item}</li>
            ))}
          </ul>
          <Link href="/cadastro" className="oe-btn mt-8">Começar agora</Link>
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
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
