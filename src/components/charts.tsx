"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { CATEGORY_LABEL } from "@/lib/labels";
import type { Category } from "@/types/domain";

export function WeeklyChart({ data }: { data: { label: string; concluidas: number }[] }) {
  return (
    <div className="oe-scroll h-56 w-full">
      <div className="h-full min-w-[16rem]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="concluidas" name="Concluídas" fill="#38d0fc" radius={6} />
        </BarChart>
      </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Tarefas concluídas na semana</caption>
        <tbody>
          {data.map((item) => (
            <tr key={item.label}><th>{item.label}</th><td>{item.concluidas}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReportCharts({
  completed,
  study,
  pending,
  categories,
}: {
  completed: { label: string; concluidas: number }[];
  study: { label: string; minutos: number }[];
  pending: { materia: string; pendentes: number }[];
  categories: { categoria: string; quantidade: number }[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Tarefas concluídas" text="Quantidade marcada como concluída em cada intervalo do período.">
        {completed.length === 0 ? <p className="text-sm text-muted">Sem intervalos neste período.</p> : (
          <div className="oe-scroll h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completed}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="concluidas" name="Concluídas" fill="#38d0fc" radius={6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>
      <ChartCard title="Evolução da produtividade" text="A mesma contagem de conclusões, em linha, para ver a variação.">
        <div className="oe-scroll h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={completed}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <Tooltip />
              <Line dataKey="concluidas" name="Concluídas" stroke="#38d0fc" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
      <ChartCard title="Tempo de estudo" text="Minutos de sessões concluídas. Usa a duração real do cronômetro quando ela existe.">
        <div className="oe-scroll h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={study}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="minutos" name="Minutos" fill="#003878" radius={6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
      <ChartCard title="Pendentes por matéria" text="Situação atual, independente do período selecionado.">
        {pending.length === 0 ? <p className="text-sm text-muted">Nenhuma tarefa pendente.</p> : (
          <ul className="space-y-2 text-sm">
            {pending.map((item) => (
              <li key={item.materia} className="flex justify-between gap-3"><span>{item.materia}</span><span>{item.pendentes}</span></li>
            ))}
          </ul>
        )}
      </ChartCard>
      <ChartCard title="Distribuição por categoria" text="Tarefas criadas no período.">
        {categories.length === 0 ? <p className="text-sm text-muted">Nenhuma tarefa criada no período.</p> : (
          <ul className="space-y-2 text-sm">
            {categories.map((item) => (
              <li key={item.categoria} className="flex justify-between gap-3">
                <span>{CATEGORY_LABEL[item.categoria as Category] ?? item.categoria}</span>
                <span>{item.quantidade}</span>
              </li>
            ))}
          </ul>
        )}
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <section className="oe-card oe-pad">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 mb-4 text-sm text-muted">{text}</p>
      {children}
    </section>
  );
}
