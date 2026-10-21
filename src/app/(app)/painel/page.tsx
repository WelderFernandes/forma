import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Award,
  CalendarDays,
  Dumbbell,
  Flame,
  Footprints,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InstallAppBanner } from "@/components/pwa/install-app-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { BarChart, LineChart, RadarChart } from "@/components/charts";
import { getCurrentUser } from "@/server/auth-helpers";
import {
  getBodyMetrics,
  getCardioSessions,
  getProfile,
  getSessions,
  getTemplates,
} from "@/server/queries";
import {
  adherenceRate,
  buildInsights,
  currentStreak,
  progressionByExercise,
  weeklySetsByMuscle,
} from "@/lib/domain/insights";
import { calculateOneRepMax } from "@/lib/domain/calculators";
import { GOAL_LABELS, type Goal } from "@/lib/domain/types";
import {
  formatTrainingDays,
  isoWeekday,
  nextTrainingDate,
  normalizeTrainingDays,
  startOfWeek,
  weekdayLabel,
} from "@/lib/domain/schedule";
import { daysBetween, dayKey, formatLongDate, formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Painel",
};

const TONE_STYLES = {
  positive: "border-success/25 bg-success/[0.06]",
  info: "border-sage/35 bg-sage/[0.08]",
  warning: "border-warn/25 bg-warn/[0.06]",
  danger: "border-danger/25 bg-danger/[0.05]",
} as const;

const TONE_ICON = {
  positive: Trophy,
  info: Sparkles,
  warning: Zap,
  danger: Activity,
} as const;

const TONE_TEXT = {
  positive: "text-success",
  info: "text-brand",
  warning: "text-warn",
  danger: "text-danger",
} as const;

const WEEK_LABELS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const weekStart = startOfWeek(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const [profile, templates, sessions, bodyMetrics, cardioWeek] =
    await Promise.all([
      getProfile(user.id),
      getTemplates(user.id),
      getSessions(user.id, 90),
      getBodyMetrics(user.id, 60),
      getCardioSessions(user.id, { from: weekStart, to: weekEnd }),
    ]);

  const trainingDays = normalizeTrainingDays(
    profile?.trainingDays,
    profile?.daysPerWeek ?? 3,
  );
  const todayTraining = trainingDays.includes(isoWeekday(new Date()));
  const nextTraining = nextTrainingDate(trainingDays);

  const summaries = sessions.map((s) => ({
    id: s.id,
    name: s.name,
    startedAt: s.startedAt,
    completedAt: s.completedAt,
    durationSeconds: s.durationSeconds,
    status: s.status,
    items: s.items.map((item) => ({
      exerciseId: item.exerciseId,
      exerciseName: item.exercise.name,
      primaryMuscle: item.exercise.primaryMuscle,
      sets: item.sets.map((set) => ({
        weightKg: set.weightKg,
        reps: set.reps,
        rpe: set.rpe,
        completed: set.completed,
        isPr: set.isPr,
      })),
    })),
  }));

  const completed = summaries.filter((s) => s.status === "completed");
  const streak = currentStreak(summaries);
  const adherence = adherenceRate(summaries, profile?.daysPerWeek ?? 3);

  // Volume por semana (últimas 8 semanas)
  const weeklyVolume = Array.from({ length: 8 }, (_, i) => {
    const weeksAgo = 7 - i;
    const from = new Date();
    from.setDate(from.getDate() - weeksAgo * 7 - 6);
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setDate(to.getDate() - weeksAgo * 7 + 1);
    to.setHours(0, 0, 0, 0);

    const volume = completed
      .filter((s) => s.startedAt >= from && s.startedAt < to)
      .flatMap((s) => s.items)
      .flatMap((i) => i.sets)
      .filter((set) => set.completed && set.weightKg && set.reps)
      .reduce(
        (acc, set) => acc + (set.weightKg as number) * (set.reps as number),
        0,
      );

    return {
      label: i === 7 ? "atual" : `-${7 - i}`,
      value: Math.round(volume),
    };
  });

  const setsByMuscle = weeklySetsByMuscle(summaries);
  const radar = Object.entries(setsByMuscle)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([muscle, value]) => ({ label: muscle.replace("_", " "), value }));

  const progression = progressionByExercise(summaries).slice(0, 5);

  const totalVolume = weeklyVolume[weeklyVolume.length - 1]?.value ?? 0;
  const prevVolume = weeklyVolume[weeklyVolume.length - 2]?.value ?? 0;
  const volumeDelta =
    prevVolume > 0
      ? Math.round(((totalVolume - prevVolume) / prevVolume) * 100)
      : undefined;

  const sessionsThisWeek = completed.filter((s) => {
    const age = daysBetween(new Date(s.startedAt), new Date());
    return age < 7;
  }).length;

  const insights = buildInsights({
    sessions: summaries,
    bodyEntries: bodyMetrics.map((b) => ({
      date: b.date,
      weightKg: b.weightKg,
      bodyFatPct: b.bodyFatPct,
    })),
    goal: profile?.goal,
    daysPerWeek: profile?.daysPerWeek ?? 3,
  });

  const prs = completed
    .flatMap((s) =>
      s.items.flatMap((item) =>
        item.sets
          .filter((set) => set.isPr)
          .map((set) => ({
            name: item.exerciseName,
            weightKg: set.weightKg,
            reps: set.reps,
            at: s.startedAt,
          })),
      ),
    )
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 4);

  const userTemplates = templates.filter((t) => !t.isSystem);
  const suggested = templates.find((t) => !t.isSystem) ?? templates[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  // Semana atual — segunda a domingo.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = weekStart;
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const key = dayKey(date);
    const isToday = date.getTime() === today.getTime();
    const trained = completed.some((s) => {
      const started = new Date(s.startedAt);
      started.setHours(0, 0, 0, 0);
      return started.getTime() === date.getTime();
    });
    const cardio = cardioWeek.filter((entry) => dayKey(entry.date) === key);
    const cardioDone = cardio.some((entry) => entry.status === "completed");
    const planned = trainingDays.includes(isoWeekday(date));
    return {
      date,
      label: WEEK_LABELS[i],
      isToday,
      trained,
      planned,
      cardio,
      cardioDone,
    };
  });

  const targetDays = trainingDays.length;
  const cardioWeekCount = cardioWeek.filter(
    (entry) => entry.status === "completed",
  ).length;

  return (
    <div className="space-y-7">
      <InstallAppBanner />

      {/* Cabeçalho editorial */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            {formatLongDate(new Date())}
          </p>
          <h1 className="mt-2 font-display text-[clamp(2.2rem,4vw,3.3rem)] leading-[0.98]">
            {greeting}, {user.name.split(" ")[0]}.
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {profile?.goal && (
            <Badge variant="brand" className="px-3 py-1.5">
              <Target className="size-3" />
              {GOAL_LABELS[profile.goal as Goal] ?? profile.goal}
            </Badge>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href="/cardio">
              <Footprints className="size-3.5" />
              Cardio
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/progresso">
              Ver progresso
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Próximo treino — herói editorial */}
      <Card variant="feature" hoverable={false} className="overflow-hidden">
        <div className="grid lg:grid-cols-[1.35fr_0.65fr]">
          <div className="relative z-10 flex flex-col justify-between gap-8 p-6 sm:p-8 lg:p-9">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="eyebrow text-lime">
                  {todayTraining ? "Treino de hoje" : "Próximo treino"}
                </span>
                <span className="h-px w-8 bg-white/20" />
                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-cream/35">
                  {suggested
                    ? todayTraining
                      ? "Plano ativo · hoje"
                      : nextTraining
                        ? `Plano ativo · ${weekdayLabel(isoWeekday(nextTraining))}`
                        : "Plano ativo"
                    : "Comece aqui"}
                </span>
              </div>

              <h2 className="mt-4 max-w-lg font-display text-[clamp(2rem,3.6vw,3rem)] leading-[0.98] text-cream">
                {suggested ? suggested.name : "Sua primeira ficha começa agora."}
              </h2>
              <p className="mt-3 max-w-md text-[13px] leading-relaxed text-cream/50">
                {suggested
                  ? `${suggested.items.length} exercícios · ${suggested.estMinutes} min estimados. Aquecimento, séries e descanso já organizados.`
                  : "Responda o questionário e o plano é montado para o seu corpo, tempo e equipamento."}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[11px] text-cream/55">
                  <Dumbbell className="size-3.5 text-lime" />
                  {suggested ? `${suggested.items.length} exercícios` : "Plano sob medida"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[11px] text-cream/55">
                  <Timer className="size-3.5 text-lime" />
                  {suggested ? `~${suggested.estMinutes} min` : "3 min para montar"}
                </span>
                {trainingDays.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[11px] text-cream/55">
                    <CalendarDays className="size-3.5 text-lime" />
                    {formatTrainingDays(trainingDays)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="brand" size="lg" className="px-7">
                <Link
                  href={suggested ? `/treinos/${suggested.id}` : "/treinos/novo"}
                >
                  {suggested ? "Abrir treino" : "Criar minha ficha"}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="border border-white/12 text-cream/70 hover:bg-white/10 hover:text-cream"
              >
                <Link href="/treinos">Ver todas as fichas</Link>
              </Button>
            </div>
          </div>

          <div className="relative hidden min-h-[280px] lg:block">
            <Image
              src="/media/gym.jpg"
              alt="Academia com halteres e bancos"
              fill
              sizes="(max-width: 1024px) 0vw, 32vw"
              className="object-cover opacity-80 photo-warm"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/25 to-ink/30" />
            <div className="absolute inset-x-4 bottom-4 rounded-[20px] border border-white/12 bg-ink/55 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-cream/40">
                  Semana atual
                </p>
                <p className="text-[10px] font-semibold text-lime">
                  {sessionsThisWeek}/{targetDays}
                </p>
              </div>
              <div className="mt-2.5 flex gap-1">
                {Array.from({ length: targetDays }, (_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${
                      i < sessionsThisWeek ? "bg-lime" : "bg-white/15"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-2.5 text-[10px] text-cream/35">
                {adherence}% de adesão nas últimas semanas
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Números */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Flame}
          label="Sequência"
          value={streak}
          unit={streak === 1 ? "dia" : "dias"}
          accent="brand"
          hint="Treinos consecutivos"
        />
        <StatCard
          icon={Dumbbell}
          label="Volume na semana"
          value={formatNumber(totalVolume)}
          unit="kg"
          delta={volumeDelta}
          hint="Carga total movimentada"
        />
        <StatCard
          icon={CalendarDays}
          label="Treinos na semana"
          value={sessionsThisWeek}
          unit={`/ ${targetDays}`}
          hint={`${adherence}% de adesão`}
        />
        <StatCard
          icon={Timer}
          label="Tempo treinando"
          value={formatNumber(
            completed.reduce(
              (acc, s) => acc + (s.durationSeconds ?? 0),
              0,
            ) / 60,
          )}
          unit="min"
          hint="Acumulado em todos os treinos"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Coach */}
        <Card className="lg:col-span-2" hoverable={false}>
          <CardHeader className="flex-row items-start justify-between gap-3 pb-4">
            <div>
              <p className="eyebrow text-muted">Leitura do seu histórico</p>
              <CardTitle className="mt-2 font-display text-[28px] font-normal">
                Orientação
              </CardTitle>
            </div>
            <Badge variant="outline">
              <Sparkles className="size-3" />
              {insights.length} {insights.length === 1 ? "análise" : "análises"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {insights.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="Ainda sem dados suficientes"
                description="Registre o primeiro treino para a orientação analisar volume, progressão e carga."
                action={
                  <Button asChild variant="brand" size="sm">
                    <Link href="/treinos">Treinar agora</Link>
                  </Button>
                }
              />
            ) : (
              insights.slice(0, 5).map((insight) => {
                const Icon = TONE_ICON[insight.tone];
                return (
                  <div
                    key={insight.id}
                    className={`rounded-2xl border p-3.5 ${TONE_STYLES[insight.tone]}`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-current/15 bg-background/40 ${TONE_TEXT[insight.tone]}`}
                      >
                        <Icon className="size-4" strokeWidth={1.8} />
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[13.5px] font-semibold tracking-[-0.01em]">
                            {insight.title}
                          </p>
                          {insight.metric && (
                            <Badge variant="outline" className="text-[10px]">
                              {insight.metric}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[12.5px] leading-relaxed text-muted">
                          {insight.body}
                        </p>
                        {insight.action && (
                          <Link
                            href={insight.action.href}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
                          >
                            {insight.action.label}
                            <ArrowRight className="size-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Semana */}
        <Card hoverable={false}>
          <CardHeader className="pb-4">
            <p className="eyebrow text-muted">Ritmo</p>
            <CardTitle className="mt-2 font-display text-[28px] font-normal">
              Sua semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1.5">
              {week.map((day) => (
                <div
                  key={day.label}
                  title={
                    [
                      day.planned ? "Treino planejado" : "Descanso",
                      day.trained ? "Treino concluído" : null,
                      day.cardio.length > 0
                        ? `${day.cardio.length} cardio(s)`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  }
                  className={`flex flex-col items-center gap-2 rounded-xl border py-2.5 ${
                    day.trained
                      ? "border-lime bg-lime text-lime-ink"
                      : day.isToday
                        ? "border-foreground/30 bg-surface-warm/70 text-foreground"
                        : day.planned
                          ? "border-brand/30 bg-brand-soft/40 text-brand"
                          : day.cardioDone
                            ? "border-clay/35 bg-clay/10 text-clay"
                            : "border-border-soft bg-surface/50 text-muted"
                  }`}
                >
                  <span className="text-[9px] font-semibold uppercase tracking-[0.06em]">
                    {day.label}
                  </span>
                  <span
                    className={`grid size-5 place-items-center rounded-full text-[9px] font-semibold ${
                      day.trained
                        ? "bg-lime-ink/10 text-lime-ink"
                        : "bg-foreground/[0.05]"
                    }`}
                  >
                    {day.date.getDate()}
                  </span>
                  <span className="flex h-1.5 items-center gap-1">
                    {(day.planned || day.trained) && (
                      <span
                        className={`size-1.5 rounded-full ${
                          day.trained ? "bg-lime-ink/55" : "bg-current opacity-70"
                        }`}
                      />
                    )}
                    {day.cardio.length > 0 && (
                      <span
                        className={`size-1.5 rounded-full bg-clay ${
                          day.cardioDone ? "opacity-100" : "opacity-45"
                        }`}
                      />
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] text-muted">
              <span className="inline-flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-brand" /> treino
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-clay" /> cardio
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-2.5" />{" "}
                {formatTrainingDays(trainingDays)}
              </span>
            </div>

            <div className="mt-5 space-y-3 border-t border-border-soft pt-4">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted">Treinos concluídos</span>
                <span className="font-semibold tabular">
                  {sessionsThisWeek} de {targetDays}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]">
                <div
                  className="h-full rounded-full bg-lime"
                  style={{
                    width: `${Math.min(100, (sessionsThisWeek / Math.max(1, targetDays)) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[11.5px] leading-relaxed text-muted">
                {sessionsThisWeek >= targetDays
                  ? "Meta da semana concluída. O descanso também faz parte do plano."
                  : `Faltam ${Math.max(0, targetDays - sessionsThisWeek)} treino(s) para fechar a semana.`}
              </p>
              <p className="flex items-center gap-1.5 text-[11px] text-muted">
                <Footprints className="size-3.5 text-clay" />
                {cardioWeekCount > 0
                  ? `${cardioWeekCount} cardio${cardioWeekCount > 1 ? "s" : ""} concluído${cardioWeekCount > 1 ? "s" : ""} nesta semana`
                  : "Dias livres também podem receber um cardio leve."}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/progresso">
                  Ver histórico
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/cardio">
                  <Footprints className="size-3.5" />
                  Cardio
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Recordes */}
        <Card hoverable={false}>
          <CardHeader className="pb-4">
            <p className="eyebrow text-muted">Marcas pessoais</p>
            <CardTitle className="mt-2 font-display text-[26px] font-normal">
              Recordes recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {prs.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-surface/50 p-4 text-[12.5px] leading-relaxed text-muted">
                Nenhum recorde ainda. Complete séries com peso para o app
                detectar suas marcas automaticamente.
              </p>
            ) : (
              prs.map((pr, i) => {
                const estimate = calculateOneRepMax(
                  pr.weightKg ?? 0,
                  pr.reps ?? 1,
                ).value;
                return (
                  <div
                    key={`${pr.name}-${i}`}
                    className="flex items-center gap-3 rounded-2xl border border-border-soft bg-surface/60 p-3"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                      <Award className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{pr.name}</p>
                      <p className="text-[11px] text-muted">
                        {pr.weightKg ?? 0} kg × {pr.reps ?? 0} reps
                      </p>
                    </div>
                    <span className="text-[13px] font-semibold tabular">
                      {estimate} kg
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Volume */}
        <Card hoverable={false}>
          <CardHeader className="flex-row items-start justify-between gap-3 pb-2">
            <div>
              <p className="eyebrow text-muted">Últimas 8 semanas</p>
              <CardTitle className="mt-2 font-display text-[26px] font-normal">
                Volume por semana
              </CardTitle>
            </div>
            <div className="text-right">
              <p className="font-display text-[30px] leading-none">
                {formatNumber(totalVolume)}
                <span className="ml-1 font-body text-[10px] text-muted">kg</span>
              </p>
              {volumeDelta !== undefined && (
                <p
                  className={`mt-1 text-[10px] font-semibold ${
                    volumeDelta >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {volumeDelta >= 0 ? "+" : ""}
                  {volumeDelta}% vs. semana anterior
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <LineChart data={weeklyVolume} format="kg" height={180} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card hoverable={false}>
          <CardHeader className="pb-2">
            <p className="eyebrow text-muted">Últimos 7 dias</p>
            <CardTitle className="mt-2 font-display text-[26px] font-normal">
              Equilíbrio muscular
            </CardTitle>
          </CardHeader>
          <CardContent>
            {radar.length >= 3 ? (
              <RadarChart axes={radar} size={280} />
            ) : (
              <div className="flex h-44 items-center justify-center px-6 text-center text-[12.5px] text-muted">
                Treine pelo menos 3 grupos musculares para ver o equilíbrio.
              </div>
            )}
          </CardContent>
        </Card>

        <Card hoverable={false}>
          <CardHeader className="pb-2">
            <p className="eyebrow text-muted">1RM estimado</p>
            <CardTitle className="mt-2 font-display text-[26px] font-normal">
              Progressão por exercício
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progression.length > 0 ? (
              <BarChart
                data={progression.map((p) => ({
                  label: p.exerciseName.split("(")[0].trim().slice(0, 14),
                  value: p.current,
                }))}
                format="kg"
                height={180}
              />
            ) : (
              <div className="flex h-44 items-center justify-center px-6 text-center text-[12.5px] text-muted">
                Complete o mesmo exercício duas vezes para acompanhar a
                progressão.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fichas do usuário */}
      {userTemplates.length > 0 && (
        <Card hoverable={false}>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <div>
              <p className="eyebrow text-muted">Biblioteca pessoal</p>
              <CardTitle className="mt-2 font-display text-[26px] font-normal">
                Suas fichas
              </CardTitle>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/treinos">
                Ver todas
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {userTemplates.slice(0, 6).map((template) => (
              <Link
                key={template.id}
                href={`/treinos/${template.id}`}
                className="group rounded-2xl border border-border-soft bg-surface/60 p-4 transition-all duration-200 hover:border-lime hover:bg-surface"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{template.name}</p>
                  <ArrowUpRight className="size-4 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <p className="mt-1 text-[11.5px] text-muted">
                  {template.items.length} exercícios · {template.estMinutes} min
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <p className="mx-auto max-w-2xl pt-2 text-center text-[10.5px] leading-relaxed text-muted">
        O Forma é uma ferramenta de bem-estar geral e não substitui avaliação
        médica, fisioterápica ou nutricional. Se você tem alguma condição de
        saúde, procure um profissional antes de treinar.
      </p>
    </div>
  );
}
