# NexStudy

Aplicação web para o estudante organizar tarefas, provas, trabalhos, grade horária, calendário, sessões de estudo e avisos. Cada conta vê e altera somente os próprios dados.

A interface está em português do Brasil. Datas e horários são exibidos no fuso `America/Sao_Paulo`.

## Funcionalidades

- Página inicial, login, cadastro e recuperação de senha
- Painel com resumo real do dia, prazos, prioridades e produtividade da semana
- Tarefas com criação, edição, exclusão confirmada, conclusão, reabertura, pesquisa, filtros e ordenação
- Provas e trabalhos, com preparação, conteúdo e conclusão de trabalhos
- Grade semanal com bloqueio de horários sobrepostos
- Calendário mensal, semanal e diário
- Sessões de estudo, histórico e cronômetro enquanto a página está aberta
- Matérias com resumo e desvinculação ao excluir
- Relatórios do período selecionado
- Notificações internas e preferências
- Perfil, tema, densidade e exclusão da conta

Sem as variáveis do Supabase, o site abre e mostra estados vazios com o próximo passo.

## Tecnologias

- Next.js (App Router), React e TypeScript
- Tailwind CSS
- Supabase Auth e PostgreSQL, com RLS
- React Hook Form e Zod
- Lucide
- Recharts
- Vitest

## Pastas

- `src/app` — rotas e layouts
- `src/components` — interface
- `src/lib` — datas, validação, filtros, relatórios e clientes Supabase
- `src/server` — leitura e ações no servidor
- `supabase/migrations` — SQL versionado
- `public/logo-nexstudy.png` — logotipo oficial

## Pré-requisitos

- Node.js 22
- npm
- Um projeto no [Supabase](https://supabase.com)

## Instalação

```bash
npm install
cp .env.example .env.local
```

Preencha `.env.local` com a URL e a chave anon do seu projeto. Não invente esses valores e não coloque a chave secreta de administração em nenhuma variável `NEXT_PUBLIC_`.

## Supabase

1. Crie um projeto em branco.
2. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public**.
3. No **SQL Editor**, execute, nesta ordem:
   - `supabase/migrations/20261022120000_schema.sql`
   - `supabase/migrations/20261022120100_rls.sql`
   - `supabase/migrations/20261022120200_notification_contact.sql`
4. Em **Authentication → URL configuration**, adicione:
   - Site URL: o valor de `NEXT_PUBLIC_SITE_URL`
   - Redirect URLs: `http://localhost:3000/auth/callback` e, na Vercel, `https://seu-dominio/auth/callback`
5. Em **Authentication → Providers → Email**, deixe o provedor ativo e desligue a confirmação de e-mail. A interface pede o nome, não um e-mail de login. O cadastro grava um endereço interno, que não aparece na tela. Com a confirmação ligada, a conta não consegue entrar.
6. As migrations criam o bucket público `avatars` para a foto de perfil, com limite de 2 MB.

Não existe tabela separada de eventos de calendário. O calendário projeta tarefas, avaliações, sessões e aulas já salvas.

A função `delete_own_account` apaga o usuário autenticado e, em cascata, os dados ligados a ele. Ela não usa a chave secreta de administração.

## Variáveis

| Variável | Onde fica | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | navegador e servidor | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | navegador e servidor | chave anon, limitada pelo RLS |
| `NEXT_PUBLIC_SITE_URL` | links de e-mail | origem dos retornos de autenticação |

Variáveis futuras, ainda não lidas pelo código: `EMAIL_FROM` e `RESEND_API_KEY`. O aplicativo não envia e-mail de aviso.

## Como rodar

```bash
npm run dev
```

Abra `http://localhost:3000`.

Outros comandos:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm start
```

## Testes

Os testes cobrem fuso de Brasília, filtros de tarefas, sobreposição de horários, notificações, painel, relatórios, calendário, validação e a presença de RLS nas migrations. Eles também verificam que o código em `src` não referencia a chave secreta de administração.

## Deploy na Vercel

1. Importe o projeto na Vercel.
2. Defina as três variáveis de ambiente.
3. Use `NEXT_PUBLIC_SITE_URL` com o domínio público, sem barra no final.
4. Inclua `https://seu-dominio/auth/callback` nas Redirect URLs do Supabase.
5. O comando de build é `npm run build`.

`node_modules` e `.next` não fazem parte do código-fonte.
