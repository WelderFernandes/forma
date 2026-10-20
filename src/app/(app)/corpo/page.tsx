import type { Metadata } from "next";
import Link from "next/link";
import { Scale, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { BarChart, LineChart } from "@/components/charts";
import { BodyMetricForm } from "@/components/body-metric-form";
import { getCurrentUser } from "@/server/auth-helpers";
import { getBodyMetrics, getProfile } from "@/server/queries";
import { calculateBmi } from "@/lib/domain/calculators";
import { cn, formatDate, formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Corpo e medidas",
};

/* ───────────────────────────── Constantes visuais ───────────────────────────── */

/** Faixas do IMC desenhadas na régua de classificação. */
const BMI_BANDS = [
  { label: "Abaixo do peso", range: "< 18,5", from: 12, to: 18.5, bar: "bg-sage" },
  { label: "Peso normal", range: "18,5 – 24,9", from: 18.5, to: 25, bar: "bg-success" },
  { label: "Sobrepeso", range: "25,0 – 29,9", from: 25, to: 30, bar: "bg-warn" },
  { label: "Obesidade", range: "≥ 30,0", from: 30, to: 40, bar: "bg-danger" },
] as const;

/** Menor valor da régua de IMC. */
const BMI_SCALE_MIN = 12;
/** Maior valor da régua de IMC. */
const BMI_SCALE_MAX = 40;

/** Cores aplicadas à classificação do IMC, conforme o retorno de calculateBmi. */
const BMI_COLORS: Record<
  string,
  { chip: string; text: string }
> = {
  sky: {
    chip: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
    text: "text-sky-600 dark:text-sky-400",
  },
  emerald: {
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    text: "text-amber-600 dark:text-amber-400",
  },
  rose: {
    chip: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    text: "text-rose-600 dark:text-rose-400",
  },
};

/** Circunferências monitoradas, na ordem em que aparecem nos gráficos. */
const MEASUREMENTS = [
  { key: "chestCm", label: "Peito" },
  { key: "waistCm", label: "Cintura" },
  { key: "hipCm", label: "Quadril" },
  { key: "armCm", label: "Braço" },
  { key: "thighCm", label: "Coxa" },
] as const;

/**
 * Rotula apenas alguns pontos do eixo para o gráfico não ficar poluído
 * quando a série tem muitos registros.
 */
function sparseLabels(labels: string[], every = 5): string[] {
  return labels.map((label, index) =>
    index % every === 0 || index === labels.length - 1 ? label : "",
  );
}

/* ───────────────────────────── Página ───────────────────────────── */

export default async function BodyPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [profile, metrics] = await Promise.all([
    getProfile(user.id),
    getBodyMetrics(user.id, 120),
  ]);

  // O histórico vem do banco em ordem decrescente; a linha do tempo precisa
  // crescente para os gráficos.
  const timeline = [...metrics].reverse();
  const latest = metrics[0] ?? null;
  const oldest = timeline[0] ?? null;

  const weightKg = latest?.weightKg ?? profile?.weightKg ?? null;
  const heightCm = profile?.heightCm ?? null;
  const bmi = weightKg !== null && heightCm !== null ? calculateBmi(weightKg, heightCm) : null;

  // Evolução do peso e da gordura corporal (últimos 30 registros com valor).
  const weightTimeline = timeline.filter((m) => m.weightKg !== null).slice(-30);
  const fatTimeline = timeline.filter((m) => m.bodyFatPct !== null).slice(-30);

  const weightSeries = weightTimeline.map((m) => ({
    label: formatDate(m.date, { day: "2-digit", month: "2-digit" }),
    value: m.weightKg as number,
  }));
  const fatSeries = fatTimeline.map((m) => ({
    label: formatDate(m.date, { day: "2-digit", month: "2-digit" }),
    value: m.bodyFatPct as number,
  }));

  // Rotula poucos pontos do eixo para as séries longas continuarem legíveis.
  const weightLabels = sparseLabels(weightSeries.map((point) => point.label), 5);
  const fatLabels = sparseLabels(fatSeries.map((point) => point.label), 5);
  const weightChartData = weightSeries.map((point, index) => ({
    ...point,
    label: weightLabels[index],
  }));
  const fatChartData = fatSeries.map((point, index) => ({
    ...point,
    label: fatLabels[index],
  }));

  // Comparação de medidas: primeira medição contra a mais recente.
  const firstMeasures = MEASUREMENTS.map((m) => ({
    label: m.label,
    value: oldest?.[m.key] ?? 0,
  }));
  const lastMeasures = MEASUREMENTS.map((m) => ({
    label: m.label,
    value: latest?.[m.key] ?? 0,
  }));
  const measureDeltas = MEASUREMENTS.map((m) => {
    const from = oldest?.[m.key] ?? null;
    const to = latest?.[m.key] ?? null;
    return {
      label: m.label,
      from,
      to,
      delta: from !== null && to !== null ? Math.round((to - from) * 10) / 10 : null,
    };
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <PageHeader
        eyebrow="Composição corporal"
        title="Corpo e medidas"
        description="Acompanhe peso, gordura corporal e circunferências ao longo do tempo."
        actions={<BodyMetricForm />}
      />

      {/* Sem nenhuma medição registrada */}
      {metrics.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="Nenhuma medição registrada"
          description="Registre peso, percentual de gordura e circunferências para começar a acompanhar a evolução do seu corpo."
        />
      ) : null}

      {/* IMC */}
      <Card>
        <CardHeader>
          <CardTitle>IMC</CardTitle>
          <CardDescription>
            Índice de massa corporal, calculado a partir do peso e da altura do seu perfil.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {bmi && heightCm ? (
            <>
              <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                <span
                  className={cn(
                    "font-display text-4xl font-bold tabular-nums",
                    BMI_COLORS[bmi.color]?.text,
                  )}
                >
                  {formatNumber(bmi.value, 1)}
                </span>
                <Badge className={cn("mb-1", BMI_COLORS[bmi.color]?.chip)}>
                  {bmi.label}
                </Badge>
                <span className="mb-1 text-sm text-muted-foreground">
                  Faixa {bmi.range} · {formatNumber(weightKg ?? 0, 1)} kg ·{" "}
                  {formatNumber(heightCm)} cm
                </span>
              </div>

              {/* Régua de faixas do IMC */}
              <div className="space-y-2">
                <div className="flex h-3 w-full overflow-hidden rounded-full">
                  {BMI_BANDS.map((band) => (
                    <div
                      key={band.label}
                      className={cn("h-full first:rounded-l-full last:rounded-r-full", band.bar)}
                      style={{
                        width: `${((band.to - band.from) / (BMI_SCALE_MAX - BMI_SCALE_MIN)) * 100}%`,
                      }}
                      title={`${band.label}: ${band.range}`}
                    />
                  ))}
                </div>
                <div className="relative h-4">
                  <div
                    className="absolute -translate-x-1/2 transition-none"
                    style={{
                      left: `${Math.min(
                        100,
                        Math.max(
                          0,
                          ((bmi.value - BMI_SCALE_MIN) / (BMI_SCALE_MAX - BMI_SCALE_MIN)) * 100,
                        ),
                      )}%`,
                    }}
                  >
                    <span className="mx-auto block size-3 rotate-45 rounded-[3px] bg-foreground" />
                  </div>
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  {BMI_BANDS.map((band) => (
                    <span key={band.label} className="text-center">
                      {band.range}
                    </span>
                  ))}
                </div>
              </div>

              <p className="rounded-xl border border-border bg-surface p-3.5 text-sm text-muted-foreground">
                {bmi.advice}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {heightCm
                ? "Registre o seu peso para calcular o IMC."
                : "Informe a sua altura no perfil para calcular o IMC."}{" "}
              <Link
                href="/configuracoes"
                className="font-medium text-brand underline-offset-4 hover:underline"
              >
                Abrir configurações
              </Link>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Composição corporal */}
      {metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Composição corporal</CardTitle>
            <CardDescription>
              Peso e percentual de gordura das últimas medições.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-medium text-muted-foreground">Peso atual</p>
                <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                  {latest?.weightKg !== null && latest?.weightKg !== undefined
                    ? `${formatNumber(latest.weightKg, 1)} kg`
                    : "—"}
                </p>
                {latest?.date && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Medido em {formatDate(latest.date, { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-medium text-muted-foreground">Gordura corporal</p>
                <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                  {latest?.bodyFatPct !== null && latest?.bodyFatPct !== undefined
                    ? `${formatNumber(latest.bodyFatPct, 1)}%`
                    : "—"}
                </p>
                {latest?.date && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Medido em {formatDate(latest.date, { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Evolução do peso (kg)</p>
                <LineChart data={weightChartData} height={170} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Evolução da gordura corporal (%)</p>
                <LineChart data={fatChartData} color="var(--chart-3)" height={170} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medidas */}
      {metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Medidas</CardTitle>
            <CardDescription>
              Comparação entre a primeira e a última medição de circunferência.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Primeira medição (cm)</p>
                <BarChart data={firstMeasures} color="var(--chart-4)" height={160} />
                {oldest?.date && (
                  <p className="text-xs text-muted-foreground">
                    {formatDate(oldest.date, { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Última medição (cm)</p>
                <BarChart data={lastMeasures} color="var(--chart-1)" height={160} />
                {latest?.date && (
                  <p className="text-xs text-muted-foreground">
                    {formatDate(latest.date, { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>

            <ul className="grid gap-2 sm:grid-cols-2">
              {measureDeltas.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5"
                >
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="flex items-center gap-2 text-sm tabular-nums">
                    <span className="text-muted-foreground">
                      {item.from !== null ? `${formatNumber(item.from, 1)} cm` : "—"}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-semibold">
                      {item.to !== null ? `${formatNumber(item.to, 1)} cm` : "—"}
                    </span>
                    {item.delta !== null && item.delta !== 0 && (
                      <span
                        className={cn(
                          "flex items-center gap-0.5 text-xs font-semibold",
                          item.delta < 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400",
                        )}
                      >
                        {item.delta < 0 ? (
                          <TrendingDown className="size-3" />
                        ) : (
                          <TrendingUp className="size-3" />
                        )}
                        {formatNumber(Math.abs(item.delta), 1)} cm
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Registrar medição */}
      <Card>
        <CardHeader>
          <CardTitle>Registrar medição</CardTitle>
          <CardDescription>
            Preencha apenas o que você mediu — os campos em branco continuam com o valor
            anterior.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <BodyMetricForm />
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5" />
            Medir sempre nas mesmas condições deixa a comparação justa.
          </p>
        </CardContent>
      </Card>

      {/* Histórico */}
      {metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
            <CardDescription>Últimas medições registradas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="-mx-1 overflow-x-auto px-1">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Data</th>
                    <th className="px-3 py-2 font-medium">Peso</th>
                    <th className="px-3 py-2 font-medium">Gordura</th>
                    <th className="px-3 py-2 font-medium">Peito</th>
                    <th className="px-3 py-2 font-medium">Cintura</th>
                    <th className="px-3 py-2 font-medium">Quadril</th>
                    <th className="px-3 py-2 font-medium">Braço</th>
                    <th className="px-3 py-2 font-medium">Coxa</th>
                    <th className="px-3 py-2 font-medium">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.slice(0, 15).map((metric) => (
                    <tr key={metric.id} className="border-b border-border/60 last:border-0">
                      <td className="whitespace-nowrap px-3 py-2.5 font-medium">
                        {formatDate(metric.date, { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {metric.weightKg !== null ? `${formatNumber(metric.weightKg, 1)} kg` : "—"}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {metric.bodyFatPct !== null
                          ? `${formatNumber(metric.bodyFatPct, 1)}%`
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {metric.chestCm !== null ? `${formatNumber(metric.chestCm, 1)} cm` : "—"}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {metric.waistCm !== null ? `${formatNumber(metric.waistCm, 1)} cm` : "—"}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {metric.hipCm !== null ? `${formatNumber(metric.hipCm, 1)} cm` : "—"}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {metric.armCm !== null ? `${formatNumber(metric.armCm, 1)} cm` : "—"}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {metric.thighCm !== null ? `${formatNumber(metric.thighCm, 1)} cm` : "—"}
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-2.5 text-muted-foreground">
                        {metric.notes ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
