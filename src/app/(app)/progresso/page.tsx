import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Award,
  Dumbbell,
  Flame,
  Sparkles,
  Target,
  Trophy,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Progress } from "@/components/ui/primitives";
import { BarChart, LineChart, RadarChart } from "@/components/charts";
import { getCurrentUser } from "@/server/auth-helpers";
import { getBodyMetrics, getProfile, getSessions } from "@/server/queries";
import {
  adherenceRate,
  buildInsights,
  currentStreak,
  weeklySetsByMuscle,
  type SessionSummary,
} from "@/lib/domain/insights";
import { calculateOneRepMax, calculateVolume } from "@/lib/domain/calculators";
import { MUSCLE_LABELS } from "@/lib/domain/types";
import { cn, dayKey, daysBetween, formatDate, formatNumber, startOfDay } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Progresso",
};

/* ───────────────────────────── Constantes visuais ───────────────────────────── */

/** Estilo de cada tom de insight devolvido pelo coach. */
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

/**
 * Rotula apenas alguns pontos do eixo para o gráfico não ficar poluído
 * quando a série tem muitos treinos.
 */
function sparseLabels(labels: string[], every = 3): string[] {
  return labels.map((label, index) =>
    index % every === 0 || index === labels.length - 1 ? label : "",
  );
}

/* ───────────────────────────── Página ───────────────────────────── */

export default async function ProgressPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [profile, sessions, bodyMetrics] = await Promise.all([
    getProfile(user.id),
    getSessions(user.id, 200),
    getBodyMetrics(user.id, 120),
  ]);

  // Converte as sessões do banco para o formato esperado pelo motor de insights.
  const summaries: SessionSummary[] = sessions.map((session) => ({
    id: session.id,
    name: session.name,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    durationSeconds: session.durationSeconds,
    status: session.status,
    items: session.items.map((item) => ({
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

  const completed = summaries.filter((session) => session.status === "completed");
  const daysPerWeek = profile?.daysPerWeek ?? 3;

  /* ── Números principais ── */

  const streak = currentStreak(summaries);
  const adherence = adherenceRate(summaries, daysPerWeek);

  const completedSets = completed
    .flatMap((session) => session.items.flatMap((item) => item.sets))
    .filter((set) => set.completed);

  const totalVolume = calculateVolume(completedSets);
  const prCount = completedSets.filter((set) => set.isPr).length;

  // Variação do volume entre os últimos 30 dias e os 30 anteriores.
  const today = startOfDay();
  const volumeLast30 = calculateVolume(
    completed
      .filter((session) => daysBetween(startOfDay(session.startedAt), today) < 30)
      .flatMap((session) => session.items.flatMap((item) => item.sets))
      .filter((set) => set.completed),
  );
  const volumePrev30 = calculateVolume(
    completed
      .filter((session) => {
        const age = daysBetween(startOfDay(session.startedAt), today);
        return age >= 30 && age < 60;
      })
      .flatMap((session) => session.items.flatMap((item) => item.sets))
      .filter((set) => set.completed),
  );
  const volumeDelta =
    volumePrev30 > 0
      ? Math.round(((volumeLast30 - volumePrev30) / volumePrev30) * 100)
      : undefined;

  /* ── Volume semanal (últimas 8 semanas) ── */

  const weeklyVolume = Array.from({ length: 8 }, (_, index) => {
    const weeksAgo = 7 - index;
    const from = new Date(today);
    from.setDate(from.getDate() - weeksAgo * 7 - 6);
    const to = new Date(today);
    to.setDate(to.getDate() - weeksAgo * 7 + 1);

    const value = calculateVolume(
      completed
        .filter((session) => session.startedAt >= from && session.startedAt < to)
        .flatMap((session) => session.items.flatMap((item) => item.sets))
        .filter((set) => set.completed),
    );

    return {
      label: weeksAgo === 0 ? "atual" : `-${weeksAgo} sem`,
      value: Math.round(value),
    };
  });

  /* ── Séries por grupo muscular (últimos 7 dias) ── */

  const setsByMuscle = weeklySetsByMuscle(summaries);
  const muscleEntries = Object.entries(setsByMuscle)
    .filter(([, sets]) => sets > 0)
    .sort((a, b) => b[1] - a[1]);

  const muscleBar = muscleEntries.map(([muscle, sets]) => ({
    label: MUSCLE_LABELS[muscle] ?? muscle.replace(/_/g, " "),
    value: sets,
  }));

  const muscleRadar = muscleEntries
    .slice(0, 6)
    .map(([muscle, sets]) => ({
      label: MUSCLE_LABELS[muscle] ?? muscle.replace(/_/g, " "),
      value: sets,
    }));

  /* ── Progressão por exercício (1RM estimado ao longo do tempo) ── */

  const historyByExercise = new Map<
    string,
    { name: string; points: { at: Date; value: number }[] }
  >();

  for (const session of completed) {
    for (const item of session.items) {
      const estimates: number[] = [];
      for (const set of item.sets) {
        if (!set.completed || !set.weightKg || !set.reps) continue;
        estimates.push(calculateOneRepMax(set.weightKg, set.reps).value);
      }
      if (estimates.length === 0) continue;

      const entry = historyByExercise.get(item.exerciseId) ?? {
        name: item.exerciseName,
        points: [],
      };
      entry.points.push({ at: session.startedAt, value: Math.max(...estimates) });
      historyByExercise.set(item.exerciseId, entry);
    }
  }

  const progression = Array.from(historyByExercise.entries())
    .map(([exerciseId, entry]) => ({
      exerciseId,
      name: entry.name,
      points: [...entry.points]
        .sort((a, b) => a.at.getTime() - b.at.getTime())
        .slice(-12),
    }))
    .filter((entry) => entry.points.length >= 2)
    .sort((a, b) => b.points.length - a.points.length)
    .slice(0, 5);

  /* ── Recordes: melhor série de cada exercício pelo 1RM estimado ── */

  const bestByExercise = new Map<
    string,
    {
      name: string;
      weightKg: number;
      reps: number;
      at: Date;
      isPr: boolean;
      estimate: number;
    }
  >();

  for (const session of completed) {
    for (const item of session.items) {
      for (const set of item.sets) {
        if (!set.completed || !set.weightKg || !set.reps) continue;
        const estimate = calculateOneRepMax(set.weightKg, set.reps).value;
        const current = bestByExercise.get(item.exerciseId);
        if (!current || estimate > current.estimate) {
          bestByExercise.set(item.exerciseId, {
            name: item.exerciseName,
            weightKg: set.weightKg,
            reps: set.reps,
            at: session.startedAt,
            isPr: set.isPr,
            estimate,
          });
        }
      }
    }
  }

  const records = Array.from(bestByExercise.values()).sort(
    (a, b) => b.estimate - a.estimate,
  );

  /* ── Consistência: últimos 12 dias ── */

  const trainedDays = new Set(completed.map((session) => dayKey(session.startedAt)));
  const lastDays = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (11 - index));
    const key = dayKey(date);
    return {
      date,
      key,
      trained: trainedDays.has(key),
    };
  });

  /* ── Insights do coach ── */

  const insights = buildInsights({
    sessions: summaries,
    bodyEntries: bodyMetrics.map((metric) => ({
      date: metric.date,
      weightKg: metric.weightKg,
      bodyFatPct: metric.bodyFatPct,
    })),
    goal: profile?.goal,
    daysPerWeek,
  });

  /* ── Estado vazio ── */

  if (summaries.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Evolução"
          title="Progresso"
          description="Volume, carga, recordes e consistência dos seus treinos."
        />
        <EmptyState
          icon={Dumbbell}
          title="Nenhum treino registrado ainda"
          description="Complete a primeira sessão de treino para o Forma calcular volume, progressão de carga e sua consistência."
          action={
            <Button asChild variant="brand">
              <Link href="/treinos">Ir para os treinos</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <PageHeader
        eyebrow="Evolução"
        title="Progresso"
        description="Volume, carga, recordes e consistência dos seus treinos."
        actions={
          <Badge variant="outline">
            <Target className="size-3" />
            {daysPerWeek} treinos por semana
          </Badge>
        }
      />

      {/* Números principais */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Flame}
          label="Sequência atual"
          value={streak}
          unit={streak === 1 ? "dia" : "dias"}
          accent="brand"
          hint="Treinos consecutivos"
        />
        <StatCard
          icon={Dumbbell}
          label="Treinos concluídos"
          value={completed.length}
          unit="treinos"
          hint="Sessões finalizadas no total"
        />
        <StatCard
          icon={TrendingUp}
          label="Volume total"
          value={formatNumber(totalVolume)}
          unit="kg"
          delta={volumeDelta}
          deltaLabel={
            volumeDelta !== undefined
              ? "Últimos 30 dias vs. 30 anteriores"
              : "Carga movimentada no total"
          }
        />
        <StatCard
          icon={Award}
          label="Recordes detectados"
          value={prCount}
          unit={prCount === 1 ? "recorde" : "recordes"}
          hint="Séries marcadas como recorde"
        />
      </div>

      {/* Volume semanal */}
      <Card>
        <CardHeader>
          <CardTitle>Volume semanal (kg)</CardTitle>
          <CardDescription>
            Soma de peso × repetições das séries concluídas, nas últimas 8 semanas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <LineChart data={weeklyVolume} height={190} />
          <p className="text-xs text-muted-foreground">
            Última semana:{" "}
            <span className="font-semibold text-foreground">
              {formatNumber(weeklyVolume[weeklyVolume.length - 1]?.value ?? 0)} kg
            </span>{" "}
            · média das 8 semanas:{" "}
            <span className="font-semibold text-foreground">
              {formatNumber(
                Math.round(
                  weeklyVolume.reduce((acc, week) => acc + week.value, 0) /
                    Math.max(1, weeklyVolume.length),
                ),
              )}{" "}
              kg
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Volume por grupo muscular */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Volume por grupo muscular</CardTitle>
            <CardDescription>Séries concluídas nos últimos 7 dias.</CardDescription>
          </CardHeader>
          <CardContent>
            {muscleBar.length > 0 ? (
              <BarChart data={muscleBar} height={180} />
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                Nenhuma série concluída nos últimos 7 dias.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equilíbrio muscular</CardTitle>
            <CardDescription>Os 6 grupos mais treinados na semana.</CardDescription>
          </CardHeader>
          <CardContent>
            {muscleRadar.length >= 3 ? (
              <RadarChart axes={muscleRadar} size={280} />
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                Treine pelo menos 3 grupos musculares para ver o equilíbrio.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progressão por exercício */}
      <Card>
        <CardHeader>
          <CardTitle>Progressão por exercício</CardTitle>
          <CardDescription>
            Estimativa de 1RM em kg nos 5 exercícios com mais histórico (até 12 treinos de
            cada).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {progression.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há histórico suficiente. Registre pelo menos dois treinos do mesmo
              exercício para acompanhar a evolução da carga.
            </p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {progression.map((exercise) => {
                const labels = sparseLabels(
                  exercise.points.map((point) =>
                    formatDate(point.at, { day: "2-digit", month: "2-digit" }),
                  ),
                );
                return (
                  <div key={exercise.exerciseId} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium">{exercise.name}</p>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {exercise.points.length} treinos
                      </span>
                    </div>
                    <LineChart
                      data={exercise.points.map((point, index) => ({
                        label: labels[index],
                        value: point.value,
                      }))}
                      height={140}
                    />
                    <p className="text-xs text-muted-foreground">
                      Melhor marca:{" "}
                      <span className="font-semibold text-foreground">
                        {formatNumber(
                          Math.max(...exercise.points.map((point) => point.value)),
                        )}{" "}
                        kg
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recordes */}
      <Card>
        <CardHeader>
          <CardTitle>Recordes (PRs)</CardTitle>
          <CardDescription>
            Melhor estimativa de 1RM de cada exercício, ordenada do maior para o menor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum recorde ainda. Complete séries com peso para o app detectar suas
              marcas automaticamente.
            </p>
          ) : (
            <ul className="space-y-2">
              {records.slice(0, 10).map((record, index) => (
                <li
                  key={`${record.name}-${index}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <Award className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{record.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(record.weightKg, 1)} kg × {record.reps} reps ·{" "}
                      {formatDate(record.at, { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  {record.isPr && (
                    <Badge variant="warning" className="shrink-0 text-[10px]">
                      recorde
                    </Badge>
                  )}
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {record.estimate} kg
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Consistência */}
      <Card>
        <CardHeader>
          <CardTitle>Consistência</CardTitle>
          <CardDescription>
            Seus últimos 12 dias de treino e a adesão ao plano semanal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
              {lastDays.map((day) => (
                <div key={day.key} className="flex flex-col items-center gap-1">
                  <span
                    className={cn(
                      "size-8 rounded-lg border",
                      day.trained
                        ? "border-brand/40 bg-brand"
                        : "border-dashed border-border bg-surface",
                    )}
                    title={`${formatDate(day.date, { day: "2-digit", month: "short" })} — ${
                      day.trained ? "treinou" : "sem treino"
                    }`}
                  />
                  <span className="text-[10px] uppercase text-muted-foreground">
                    {formatDate(day.date, { weekday: "short" }).replace(".", "")}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded bg-brand" />
                Treinou
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded border border-dashed border-border bg-surface" />
                Sem treino
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Adesão ao plano</span>
              <span className="tabular-nums text-muted-foreground">
                {adherence}% nas últimas 4 semanas
              </span>
            </div>
            <Progress value={adherence} />
            <p className="text-xs text-muted-foreground">
              O plano pede {daysPerWeek} treinos por semana. Encurte as sessões em vez de
              pulá-las: 20 minutos feitos valem mais que 50 minutos perfeitos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Insights do coach */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Insights do coach</CardTitle>
            <CardDescription>
              Análise do seu histórico, com base em regras explicáveis.
            </CardDescription>
          </div>
          <Badge variant="brand" className="text-xs">
            <Sparkles className="size-3" />
            {insights.length} insights
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {insights.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há dados suficientes para gerar insights. Complete alguns treinos
              para o coach passar a analisar volume, progressão e carga.
            </p>
          ) : (
            insights.map((insight) => {
              const Icon = TONE_ICON[insight.tone];
              return (
                <div
                  key={insight.id}
                  className={cn("rounded-xl border p-3.5", TONE_STYLES[insight.tone])}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0">
                      <Icon className="size-4 opacity-80" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{insight.title}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {insight.category}
                        </Badge>
                        {insight.metric && (
                          <Badge variant="outline" className="text-[10px]">
                            {insight.metric}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{insight.body}</p>
                      {insight.action && (
                        <Link
                          href={insight.action.href}
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
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
    </div>
  );
}
