# Forma

**Plano de treino, dicas de execução, nutrição e bem-estar em uma web app responsiva.**

Inspirado na experiência do [BetterMe Well-Being Coach](https://play.google.com/store/apps/details?id=com.gen.workoutme)
— mas reconstruído para web: sem loja de aplicativos, sem assinatura obrigatória,
funcionando igual no celular e no desktop.

---

## O que tem dentro

| Módulo | O que faz |
|---|---|
| **Autenticação** | Better Auth (e-mail + senha), sessão persistida, rotas protegidas |
| **Onboarding** | Questionário de 11 etapas que gera um plano de treino montado |
| **Fichas de treino** | CRUD completo, templates do sistema, superséries, RPE, tempo e descanso |
| **Treino ao vivo** | Log de séries (kg/reps/RPE), cronômetro de descanso, PR automático, guia de execução embutido |
| **Biblioteca** | 68 exercícios com passo a passo, dicas de execução, erros comuns, respiração e demonstrações em vídeo/animação |
| **Progresso** | Volume semanal, 1RM estimado por exercício, PRs, equilíbrio muscular, adesão, consistência |
| **Coach** | Motor de insights determinístico: volume, fadiga, progressão estagnada, peso, PRs |
| **Corpo** | IMC, composição corporal, medidas, evolução de peso e gordura |
| **Nutrição** | 45 alimentos, 8 planos alimentares, 14 receitas, diário de refeições, água, passos, jejum |
| **Calculadoras** | IMC, TMB/TDEE, macros, 1RM, anilhas, gordura corporal — todas com a fórmula e o resultado explicado |
| **Desafios** | 10 desafios motivacionais com progresso diário |
| **Mentalidade** | 14 dicas de hábitos e confiança baseadas em TCC |
| **Conquistas** | 14 conquistas desbloqueadas automaticamente conforme o histórico |
| **PWA** | Manifest, service worker, página offline, instalável no celular |

---

## Stack

- **Next.js 15.4.8** (App Router, React 19, Turbopack)
- **TypeScript** estrito + **Tailwind CSS v4**
- **Prisma 6** + SQLite (trocar para Postgres é só mudar o `datasource` e o adapter)
- **Better Auth 1.6** com `prismaAdapter`
- **Radix UI** (primitivos acessíveis), **lucide-react**, **motion**, **sonner**, **next-themes**
- Gráficos em **SVG próprio** (`src/components/charts`) — sem dependência extra, controle total do visual

---

## Rodando localmente

Pré-requisitos: **Node 20+** e **pnpm 10+**.

```bash
pnpm install

# Cria o banco SQLite a partir do schema
pnpm exec prisma db push

# Popula exercícios, fichas, alimentos, receitas, dicas, desafios e conquistas
pnpm db:seed

pnpm dev
```

Acesse `http://localhost:3000`.

### Variáveis de ambiente

`.env` já vem pronto para desenvolvimento. Para gerar um segredo novo:

```bash
node -e "console.log(require('crypto').randomUUID().replace(/-/g,'')+require('crypto').randomUUID().replace(/-/g,''))"
```

```env
DATABASE_URL="file:./dev.db"
BETTER_AUTH_SECRET="<64 caracteres aleatórios>"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
MUSCLEWIKI_API_KEY=""
MUSCLEWIKI_BASE_URL="https://api.musclewiki.com"
EXERCISEDB_FREE_ENABLED="false"
```

### Vídeos de exercícios (MuscleWiki)

A camada **MuscleWiki** da demonstração em vídeo usa a **API oficial**. A chave fica apenas no
servidor; o app não baixa nem rehospeda os arquivos. Os metadados ficam em cache por
até 30 dias e o player usa um token de mídia de curta duração, com atribuição e link
para a MuscleWiki.

1. Crie uma chave em [api.musclewiki.com/register](https://api.musclewiki.com/register).
   O acesso pela aplicação exige um plano pago; o plano gratuito é restrito ao playground.
2. Preencha `MUSCLEWIKI_API_KEY` no `.env`.
3. Rode a prévia e confira as correspondências:

```bash
pnpm db:musclewiki
pnpm db:musclewiki -- --apply
```

Use `--force` para revalidar tudo e `--only=slug-do-exercicio` para sincronizar um
exercício específico. Os termos de busca em inglês ficam em
`src/lib/musclewiki-queries.ts`; ajuste-os se a prévia indicar uma correspondência
ruim. Sem chave configurada, o painel da MuscleWiki não aparece; a biblioteca segue
com as mídias gratuitas (Your Move/ExerciseDB) e o guia textual.

### Mídia gratuita (Your Move + ExerciseDB)

Além da MuscleWiki, a biblioteca tem duas camadas gratuitas já baixadas para
`public/demos`:

1. **Your Move** — 14 clipes verticais de 720 × 1280, usados como demonstração
   principal quando existe uma correspondência. São vídeos de estúdio, com fundo
   neutro e a marca da fonte preservada. Uso comercial permitido pela fonte;
   confira os termos atuais antes de publicar.
2. **ExerciseDB Free** — 25 animações de 180 × 180, exibidas como um **estudo de
   movimento** compacto. A licença gratuita é de **uso não comercial** e exige
   atribuição. O app marca a peça e linka a fonte.

O player resolve a mídia nesta ordem: **MuscleWiki → Your Move → ExerciseDB →
guia textual**. A ordem fica em `src/server/exercise-media.ts` e os manifestos em
`src/lib/exercise-demos.ts`.

A camada do ExerciseDB é controlada por `EXERCISEDB_FREE_ENABLED`. O `.env` local
deste projeto vem com `"true"` para o modo portfólio; `.env.example` usa `"false"`.
Para uma publicação comercial, use `"false"` — os vídeos do Your Move e o guia
textual continuam funcionando. Os créditos completos, IDs e links estão em
[`CREDITS.md`](./CREDITS.md).

> As mídias são exibidas dentro do Forma com atribuição. Não remova as marcas das
> fontes nem redistribua os arquivos como uma biblioteca de exercícios separada.

### Scripts

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento (Turbopack) |
| `pnpm build` | `prisma generate` + build de produção |
| `pnpm start` | Sobe o build de produção |
| `pnpm typecheck` | `prisma generate` + `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm db:push` | Sincroniza o schema com o banco |
| `pnpm db:seed` | Repovoa o banco (apaga tudo antes) |
| `pnpm db:musclewiki` | Sincroniza os vídeos oficiais da MuscleWiki |
| `pnpm db:studio` | Prisma Studio |

---

## Estrutura

```
src/
  app/
    (auth)/entrar, (auth)/criar-conta   # telas de acesso
    (app)/painel                        # dashboard + coach
    (app)/treinos, /treinos/[id], /treinos/novo
    (app)/treino/[sessionId]            # treino ao vivo
    (app)/exercicios, /exercicios/[slug]
    (app)/progresso, /corpo, /nutricao, /calculadoras
    (app)/desafios, /mentalidade, /configuracoes
    onboarding/                         # wizard fora do shell autenticado
  components/
    ui/                                 # primitivos (Button, Card, Dialog…)
    charts/                             # LineChart, BarChart, RadarChart, DonutChart
    *-view.tsx, *-form.tsx              # componentes de página
  lib/
    domain/                             # regras puras: cálculos, gerador de plano, coach
    exercise-demos.ts                   # manifestos Your Move + ExerciseDB
    auth.ts, auth-client.ts, prisma.ts, utils.ts
  server/
    queries.ts                          # leituras do banco
    exercise-media.ts                   # prioridade MuscleWiki → Your Move → ExerciseDB
    actions/                            # server actions (treino, perfil, nutrição, plano)
    plan.ts, achievements.ts
public/
  demos/ymove/                          # vídeos MP4 + posters locais
  demos/exercisedb/                     # animações GIF locais
prisma/
  schema.prisma
  data/                                 # conteúdo do seed (exercícios, receitas, dicas…)
  seed.ts
```

### Decisões de arquitetura

- **SQLite + JSON**: o SQLite não suporta enums nem listas, então arrays são gravados
  como JSON e validados em `src/lib/domain/types.ts`. Migrar para Postgres exige trocar
  o `datasource` e trocar os campos JSON por colunas arrays.
- **Coach determinístico**: as recomendações vêm de regras documentadas em
  `src/lib/domain/insights.ts`, não de um LLM. Isso mantém o app rápido, auditável e
  funcionando offline — e a explicação é sempre rastreável à métrica que a originou.
- **Servidor-first**: páginas são Server Components; interatividade só onde precisa.
  As mutações são Server Actions com validação Zod.
- **Gráficos próprios**: SVG sem biblioteca, para controlar a tipografia e o tema
  claro/escuro sem Fight dark mode.

---

## Responsividade

- **Mobile-first**: barra de navegação inferior com 5 destinos, drawer para o menu completo.
- **Tablet/desktop**: sidebar fixa de 64 colunas com a sequência atual no rodapé.
- **Formulários densos viram cartões** em telas pequenas (séries, medidas, macros).
- Alvos de toque de no mínimo 40px, `safe-area-inset` para notch, `dvh` para barras de
  endereço mobile.

---

## Aviso

O Forma é uma ferramenta de **bem-estar geral**. Não é um dispositivo médico, não
diagnostica e não substitui avaliação médica, fisioterapêutica ou acompanhamento
profissional de nutrição — especialmente se você tem lesão, gestação ou doença crônica.

---

## Licença

O código do Forma é MIT. As mídias em `public/demos` pertencem às fontes e têm
licenças próprias — não são cobertas pela licença MIT do código. Consulte
[`CREDITS.md`](./CREDITS.md) antes de reutilizá-las ou publicar o app.
