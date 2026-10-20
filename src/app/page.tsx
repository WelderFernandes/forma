import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Brain,
  Calculator,
  ChartNoAxesCombined,
  Check,
  HeartPulse,
  Salad,
  Scale,
  Sparkles,
  Timer,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { getCurrentUser } from "@/server/auth-helpers";

const METHOD = [
  {
    index: "01",
    image: "/media/train.jpg",
    title: "Treine com intenção",
    body: "Fichas montadas para o seu nível e equipamento. Cada série tem propósito, descanso e progressão.",
    href: "/treinos",
    tag: "Treino",
  },
  {
    index: "02",
    image: "/media/nutrition.jpg",
    title: "Coma para sustentar",
    body: "Metas calóricas e de macros que explicam o porquê. Receitas, planos e um diário sem culpa.",
    href: "/nutricao",
    tag: "Nutrição",
  },
  {
    index: "03",
    image: "/media/mind.jpg",
    title: "Cuide da cabeça",
    body: "Hábitos, constância e autocompaixão. Porque o corpo não evolui separado da mente.",
    href: "/mentalidade",
    tag: "Mente",
  },
];

const TOOLS = [
  {
    icon: ChartNoAxesCombined,
    title: "Progresso visível",
    body: "Volume semanal, recordes e equilíbrio muscular em gráficos que você entende.",
  },
  {
    icon: Calculator,
    title: "Calculadoras didáticas",
    body: "IMC, TMB, TDEE, 1RM e anilhas — cada número vem com fórmula e contexto.",
  },
  {
    icon: Salad,
    title: "Nutrição de verdade",
    body: "45 alimentos, 8 planos alimentares, receitas e metas calculadas para você.",
  },
  {
    icon: HeartPulse,
    title: "Rotina que cabe",
    body: "Escolha 2 a 6 dias e 20 a 60 minutos. O plano se adapta ao seu tempo real.",
  },
  {
    icon: Trophy,
    title: "Desafios e conquistas",
    body: "Pequenos marcos que mantêm o movimento — sem gamificação vazia.",
  },
  {
    icon: Brain,
    title: "Coach sem achismo",
    body: "Insights baseados no seu histórico: volume, fadiga, estagnação e deload.",
  },
];

const ONBOARDING_STEPS = [
  {
    n: "01",
    title: "Objetivo",
    body: "Emagrecer, ganhar massa, recompor ou simplesmente se sentir melhor.",
  },
  {
    n: "02",
    title: "Seu corpo",
    body: "Peso, altura e idade para calcular metabolismo e volume seguro.",
  },
  {
    n: "03",
    title: "Sua rotina",
    body: "Dias por semana, duração da sessão e quanto você já se move.",
  },
  {
    n: "04",
    title: "Seu plano",
    body: "Divisão, exercícios, séries e metas nutricionais prontos para começar.",
  },
];

const MARQUEE = [
  "Treino sob medida",
  "Nutrição real",
  "Mente forte",
  "Progresso visível",
  "Feito para a sua rotina",
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/painel");

  return (
    <div className="min-h-dvh bg-background">
      {/* ───────────── Hero ───────────── */}
      <section className="grain relative overflow-hidden bg-ink text-cream">
        <Image
          src="/media/hero.jpg"
          alt="Atleta preparando uma barra no chão da academia"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-[0.34] photo-warm"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/55 to-ink" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 60% at 18% 8%, rgba(216,246,90,0.13), transparent 65%)",
          }}
        />

        <header className="relative z-20 border-b border-white/10">
          <div className="mx-auto flex h-[76px] max-w-[1240px] items-center gap-4 px-5 sm:px-8">
            <Logo tone="light" />

            <nav className="ml-8 hidden items-center gap-7 text-[13px] font-medium text-cream/60 lg:flex">
              <a
                href="#metodo"
                className="transition-colors hover:text-cream"
              >
                O método
              </a>
              <a
                href="#onboarding"
                className="transition-colors hover:text-cream"
              >
                Seu plano
              </a>
              <a
                href="#recursos"
                className="transition-colors hover:text-cream"
              >
                Recursos
              </a>
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden text-cream/75 hover:bg-white/10 hover:text-cream sm:inline-flex"
              >
                <Link href="/entrar">Entrar</Link>
              </Button>
              <Button asChild variant="brand" size="sm" className="px-5">
                <Link href="/criar-conta">
                  Começar
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="relative z-10 mx-auto max-w-[1240px] px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:pb-28 lg:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.06fr_0.94fr] lg:gap-10">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-cream/75 backdrop-blur">
                  <span className="size-1.5 rounded-full bg-lime" />
                  Treino · Nutrição · Mente
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-cream/35">
                  Edição 2026
                </span>
              </div>

              <h1 className="display-hero mt-7 text-[clamp(3.5rem,8.2vw,7.1rem)] text-cream">
                A sua forma,
                <br />
                <em className="text-lime">todos os dias.</em>
              </h1>

              <p className="mt-7 max-w-[30rem] text-[16px] leading-relaxed text-cream/65 sm:text-[17px]">
                Um plano de treino que começa com você — seu corpo, sua rotina,
                seu tempo. Sem promessas vazias. Só o próximo passo, bem
                desenhado.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  variant="brand"
                  size="lg"
                  className="w-full px-8 sm:w-auto"
                >
                  <Link href="/criar-conta">
                    Montar meu plano
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="w-full border border-white/15 text-cream hover:bg-white/10 sm:w-auto"
                >
                  <Link href="/entrar">Já tenho conta</Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-medium uppercase tracking-[0.12em] text-cream/35">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-lime" /> 3 minutos
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-lime" /> 11 perguntas
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-lime" /> grátis para começar
                </span>
              </div>
            </div>

            {/* Cartão editorial com foto */}
            <div className="relative mx-auto w-full max-w-[440px] lg:ml-auto">
              <div className="absolute -left-5 top-10 hidden h-24 w-px bg-white/20 lg:block" />
              <div className="absolute -left-5 top-10 hidden -translate-x-1/2 -rotate-90 text-[9px] font-semibold uppercase tracking-[0.3em] text-cream/30 lg:block">
                Plano pessoal
              </div>

              <div className="group relative aspect-[4/5] overflow-hidden rounded-[32px] border border-white/15 bg-ink-2 shadow-[0_50px_100px_-40px_rgba(0,0,0,0.9)]">
                <Image
                  src="/media/train-2.jpg"
                  alt="Mulher treinando core na academia"
                  fill
                  sizes="(max-width: 1024px) 90vw, 440px"
                  className="object-cover photo-warm transition-transform duration-[1400ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-ink/35" />

                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
                  <span className="rounded-full border border-white/20 bg-ink/40 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-cream/75 backdrop-blur">
                    Plano 01
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-cream/45">
                    Semana 01
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="glass-dark rounded-[22px] border border-white/15 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-lime">
                          Próximo treino
                        </p>
                        <p className="mt-1.5 text-[17px] font-semibold tracking-[-0.02em] text-cream">
                          Superior · Força
                        </p>
                        <p className="mt-0.5 text-[11px] text-cream/50">
                          6 exercícios · 42 min · RPE 7
                        </p>
                      </div>
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lime text-lime-ink">
                        <ArrowUpRight className="size-4" />
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-7 gap-1">
                      {[1, 1, 0, 1, 0, 0, 0].map((done, i) => (
                        <span
                          key={i}
                          className={`h-1.5 rounded-full ${
                            done ? "bg-lime" : "bg-white/15"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="animate-float absolute -right-3 -top-5 rounded-2xl border border-white/15 bg-cream px-4 py-3 text-ink shadow-raised sm:-right-8">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-full bg-ink text-lime">
                    <Sparkles className="size-3.5" />
                  </span>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink/45">
                      Plano pronto
                    </p>
                    <p className="text-[13px] font-semibold">em 3 minutos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé do hero */}
        <div className="relative z-10 border-t border-white/10">
          <div className="mx-auto grid max-w-[1240px] grid-cols-2 divide-x divide-white/10 px-5 sm:px-8 lg:grid-cols-4">
            {[
              { value: "68", label: "exercícios explicados" },
              { value: "10", label: "fichas prontas" },
              { value: "08", label: "planos alimentares" },
              { value: "14", label: "conquistas" },
            ].map((stat) => (
              <div key={stat.label} className="px-4 py-6 first:pl-0">
                <p className="font-display text-[30px] leading-none text-cream">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-cream/35">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Faixa citron ───────────── */}
      <div className="overflow-hidden border-y border-lime-ink/10 bg-lime py-3.5 text-lime-ink">
        <div className="flex w-max animate-marquee">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              className="flex shrink-0 items-center"
              aria-hidden={copy === 1}
            >
              {MARQUEE.map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-6 px-6 text-[11px] font-semibold uppercase tracking-[0.18em]"
                >
                  {item}
                  <span className="size-1 rounded-full bg-lime-ink/40" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ───────────── Método ───────────── */}
      <section id="metodo" className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-end">
            <div>
              <p className="eyebrow text-muted">O método Forma</p>
              <h2 className="display-section mt-4 max-w-3xl text-[clamp(2.6rem,5.2vw,4.6rem)]">
                Menos ruído.
                <br />
                Mais direção.
              </h2>
            </div>
            <p className="max-w-md text-[15px] leading-relaxed text-muted lg:pb-3">
              Três pilares, uma rotina. O Forma não empilha funcionalidades: ele
              organiza o essencial para você saber o que fazer hoje, amanhã e na
              próxima semana.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {METHOD.map((item) => (
              <Link
                key={item.index}
                href={item.href}
                className="group relative overflow-hidden rounded-[28px] border border-border-soft bg-card shadow-card"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover photo-warm transition-transform duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5">
                    <span className="font-display text-[22px] leading-none text-cream/60">
                      {item.index}
                    </span>
                    <Badge className="border border-white/20 bg-ink/30 text-cream backdrop-blur">
                      {item.tag}
                    </Badge>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-5 text-cream">
                    <h3 className="font-display text-[30px] leading-none">
                      {item.title}
                    </h3>
                    <p className="mt-2.5 max-w-xs text-[13px] leading-relaxed text-cream/65">
                      {item.body}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-lime">
                      Explorar
                      <ArrowUpRight className="size-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Onboarding preview ───────────── */}
      <section id="onboarding" className="grain relative overflow-hidden bg-ink py-20 text-cream sm:py-28">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 50% at 78% 30%, rgba(216,246,90,0.1), transparent 65%)",
          }}
        />
        <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
            <div>
              <p className="eyebrow text-lime">Seu plano em 3 minutos</p>
              <h2 className="display-section mt-4 text-[clamp(2.6rem,5.2vw,4.6rem)]">
                Onze perguntas.
                <br />
                <em className="text-lime">Um plano que é seu.</em>
              </h2>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-cream/55">
                Nada de fichas genéricas. Você informa peso, altura, tempo de
                treino e rotina — o algoritmo monta a divisão, o volume e as
                metas nutricionais.
              </p>

              <div className="mt-9 space-y-0 border-t border-white/10">
                {ONBOARDING_STEPS.map((step) => (
                  <div
                    key={step.n}
                    className="flex gap-5 border-b border-white/10 py-4"
                  >
                    <span className="font-display text-[19px] leading-none text-lime/70">
                      {step.n}
                    </span>
                    <div>
                      <p className="text-[14px] font-semibold">{step.title}</p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-cream/45">
                        {step.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                asChild
                variant="brand"
                size="lg"
                className="mt-8 w-full px-7 sm:w-auto"
              >
                <Link href="/criar-conta">
                  Começar meu plano
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>

            {/* Mock do onboarding */}
            <div className="relative">
              <div className="mx-auto w-full max-w-[460px] rounded-[30px] border border-white/12 bg-white/[0.045] p-2 shadow-[0_60px_120px_-50px_rgba(0,0,0,0.9)] backdrop-blur">
                <div className="rounded-[24px] border border-white/10 bg-ink-2 p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-cream/35">
                      Passo 04 · 11
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-lime">
                      Corpo
                    </span>
                  </div>
                  <div className="mt-3 flex gap-1">
                    {Array.from({ length: 11 }, (_, i) => (
                      <span
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i < 4 ? "bg-lime" : "bg-white/12"
                        }`}
                      />
                    ))}
                  </div>

                  <h3 className="mt-8 font-display text-[36px] leading-[0.96] text-cream">
                    Qual é o seu
                    <br />
                    peso hoje?
                  </h3>
                  <p className="mt-2 text-[12px] text-cream/45">
                    Usamos para calcular metabolismo, calorias e volume seguro.
                  </p>

                  <div className="mt-8 flex items-end justify-center gap-2">
                    <span className="font-display text-[76px] leading-none text-cream">
                      72
                    </span>
                    <span className="pb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-cream/40">
                      kg
                    </span>
                  </div>

                  <div className="relative mt-6 h-10">
                    <div className="absolute inset-x-0 top-4 h-1 rounded-full bg-white/12" />
                    <div className="absolute left-0 top-4 h-1 w-[46%] rounded-full bg-lime" />
                    <span className="absolute left-[46%] top-2 size-5 -translate-x-1/2 rounded-full border-4 border-ink-2 bg-lime shadow-[0_0_0_1px_rgba(216,246,90,0.4)]" />
                  </div>
                  <div className="flex justify-between text-[9px] font-medium uppercase tracking-[0.12em] text-cream/25">
                    <span>40 kg</span>
                    <span>180 kg</span>
                  </div>

                  <div className="mt-7 grid grid-cols-2 gap-2">
                    {[
                      { icon: Scale, label: "Altura", value: "1,72 m" },
                      { icon: Timer, label: "Sessão", value: "45 min" },
                    ].map((metric) => (
                      <div
                        key={metric.label}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                      >
                        <metric.icon className="size-3.5 text-lime" />
                        <p className="mt-2 text-[9px] uppercase tracking-[0.14em] text-cream/35">
                          {metric.label}
                        </p>
                        <p className="text-[13px] font-semibold text-cream">
                          {metric.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-full bg-lime py-3 text-center text-[12px] font-semibold text-lime-ink">
                    Continuar
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-2 hidden rounded-2xl border border-white/15 bg-cream px-4 py-3 text-ink shadow-raised sm:block">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink/40">
                  Metas calculadas
                </p>
                <p className="mt-1 font-display text-[24px] leading-none">
                  2.180 <span className="font-body text-[10px]">kcal</span>
                </p>
                <p className="mt-1 text-[10px] text-ink/50">
                  142 g de proteína · 45 min
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Recursos ───────────── */}
      <section id="recursos" className="py-20 sm:py-28">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1fr] lg:items-end">
            <div>
              <p className="eyebrow text-muted">Tudo no mesmo lugar</p>
              <h2 className="display-section mt-4 text-[clamp(2.6rem,5vw,4.3rem)]">
                O essencial,
                <br />
                bem resolvido.
              </h2>
            </div>
            <p className="max-w-lg text-[15px] leading-relaxed text-muted lg:justify-self-end lg:pb-2">
              Sem menus infinitos. Cada tela responde uma pergunta — e só uma.
              Você abre, entende e volta para o que importa: treinar.
            </p>
          </div>

          <div className="mt-12 grid border-t border-border sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool, i) => (
              <div
                key={tool.title}
                className="group border-b border-border px-1 py-7 transition-colors sm:px-6 sm:odd:border-r lg:border-r lg:px-7 lg:last:border-r-0 lg:[&:nth-child(3n)]:border-r-0"
              >
                <div className="flex items-start justify-between">
                  <span className="grid size-10 place-items-center rounded-full border border-border bg-surface text-fg-2 transition-colors group-hover:border-lime group-hover:bg-lime group-hover:text-lime-ink">
                    <tool.icon className="size-4" strokeWidth={1.7} />
                  </span>
                  <span className="font-display text-[15px] text-muted/50">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-body text-[16px] font-semibold tracking-[-0.02em]">
                  {tool.title}
                </h3>
                <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted">
                  {tool.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Nutrição editorial ───────────── */}
      <section className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="relative overflow-hidden rounded-[32px] bg-ink text-cream">
            <div className="grid lg:grid-cols-2">
              <div className="relative min-h-[320px] lg:min-h-[460px]">
                <Image
                  src="/media/food.jpg"
                  alt="Prato equilibrado com vegetais, ovo e abacate"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover photo-warm"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-ink/60 lg:to-ink" />
                <div className="absolute bottom-5 left-5 rounded-full border border-white/20 bg-ink/40 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-cream/70 backdrop-blur">
                  Nutrição sem dogma
                </div>
              </div>
              <div className="flex flex-col justify-center p-7 sm:p-12">
                <p className="eyebrow text-lime">Comida de verdade</p>
                <h2 className="display-section mt-4 text-[clamp(2.3rem,4.5vw,3.8rem)]">
                  Metas que fazem sentido.
                  <br />
                  <em className="text-lime">Comida que sustenta.</em>
                </h2>
                <p className="mt-5 max-w-md text-[14px] leading-relaxed text-cream/55">
                  Calorias e macros calculados a partir do seu perfil, com
                  explicação de cada escolha. Planos alimentares, receitas
                  práticas e registro de água, passos e jejum.
                </p>
                <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
                  {[
                    { value: "45", label: "alimentos" },
                    { value: "08", label: "planos" },
                    { value: "14", label: "receitas" },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="font-display text-[34px] leading-none text-cream">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.14em] text-cream/35">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
                <Button
                  asChild
                  variant="contrast"
                  size="lg"
                  className="mt-8 w-full sm:w-auto"
                >
                  <Link href="/criar-conta">
                    Ver meu plano alimentar
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Manifesto ───────────── */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="mx-auto max-w-[1000px] px-5 text-center sm:px-8">
          <p className="eyebrow text-muted">Manifesto Forma</p>
          <blockquote className="display-section mt-6 text-[clamp(2.2rem,4.6vw,3.9rem)] text-balance">
            “Você não precisa de mais um app.
            <br />
            Precisa de um plano que{" "}
            <em className="text-brand">caiba na sua vida.</em>”
          </blockquote>
          <p className="mt-6 text-[12px] font-medium uppercase tracking-[0.16em] text-muted">
            Feito para quem começa — e para quem recomeça
          </p>
        </div>
      </section>

      {/* ───────────── CTA final ───────────── */}
      <section className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="relative overflow-hidden rounded-[32px] bg-lime px-6 py-14 text-lime-ink sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute -right-16 -top-24 size-[380px] rounded-full border border-lime-ink/15" />
            <div className="pointer-events-none absolute -bottom-32 -right-6 size-[420px] rounded-full border border-lime-ink/10" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="eyebrow text-lime-ink/55">Comece hoje</p>
                <h2 className="display-section mt-4 max-w-2xl text-[clamp(2.5rem,5.5vw,4.6rem)]">
                  Seu próximo treino começa com uma pergunta.
                </h2>
                <p className="mt-4 max-w-md text-[14px] leading-relaxed text-lime-ink/60">
                  Crie sua conta, responda o questionário e receba seu plano em
                  menos de três minutos. Sem cartão. Sem pegadinha.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
                <Button
                  asChild
                  size="lg"
                  className="bg-lime-ink px-8 text-lime hover:bg-ink"
                >
                  <Link href="/criar-conta">
                    Criar minha conta
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="text-lime-ink hover:bg-lime-ink/10"
                >
                  <Link href="/entrar">Já tenho conta</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Footer ───────────── */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div>
              <Logo />
              <p className="mt-4 max-w-xs text-[12.5px] leading-relaxed text-muted">
                Treino, nutrição e mente em um só lugar. Uma ferramenta de
                bem-estar geral — não substitui avaliação médica ou
                acompanhamento profissional.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-[12.5px] text-muted sm:grid-cols-3">
              <Link href="/treinos" className="hover:text-foreground">
                Treinos
              </Link>
              <Link href="/exercicios" className="hover:text-foreground">
                Exercícios
              </Link>
              <Link href="/nutricao" className="hover:text-foreground">
                Nutrição
              </Link>
              <Link href="/progresso" className="hover:text-foreground">
                Progresso
              </Link>
              <Link href="/calculadoras" className="hover:text-foreground">
                Calculadoras
              </Link>
              <Link href="/mentalidade" className="hover:text-foreground">
                Mentalidade
              </Link>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-2 border-t border-border pt-5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted sm:flex-row">
            <p>© {new Date().getFullYear()} Forma · Atelier de treino</p>
            <p>Feito para a vida real · pt-BR</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
