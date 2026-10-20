import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ClipboardPlus,
  Dumbbell,
  Flame,
  Gauge,
  Layers,
  Lightbulb,
  ListChecks,
  Tag,
  Wind,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { ExerciseMedia } from "@/components/exercise-media";
import { FavoriteButton } from "@/components/favorite-button";
import { getCurrentUser } from "@/server/auth-helpers";
import { getExerciseMedia } from "@/server/exercise-media";
import prisma from "@/lib/prisma";
import {
  CATEGORY_LABELS,
  EQUIPMENT_LABELS,
  LEVEL_LABELS,
  MUSCLE_LABELS,
  normalizeMuscle,
  parseJsonArray,
  type Category,
  type Equipment,
  type Level,
} from "@/lib/domain/types";
import { titleCase } from "@/lib/utils";

/** Rótulos do impacto articular — não existe mapa de domínio para esse campo. */
const IMPACT_LABELS: Record<string, string> = {
  low: "Baixo",
  moderate: "Moderado",
  high: "Alto",
};

const IMPACT_VARIANTS: Record<string, "success" | "warning" | "danger"> = {
  low: "success",
  moderate: "warning",
  high: "danger",
};

/**
 * O banco grava as chaves de músculo sem acento ("gluteos"), enquanto o mapa de
 * domínio usa chaves acentuadas ("glúteos"). Normalizamos as duas pontas para
 * que os rótulos sempre apareçam.
 */
const MUSCLE_LABEL_BY_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(MUSCLE_LABELS).map(([key, label]) => [normalizeMuscle(key), label]),
);

function muscleLabel(value: string): string {
  return MUSCLE_LABEL_BY_KEY[normalizeMuscle(value)] ?? titleCase(value);
}

function equipmentLabel(value: string): string {
  return EQUIPMENT_LABELS[value as Equipment] ?? titleCase(value);
}

function categoryLabel(value: string): string {
  return CATEGORY_LABELS[value as Category] ?? titleCase(value);
}

function levelLabel(value: string): string {
  return LEVEL_LABELS[value as Level] ?? titleCase(value);
}

function DataRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-2.5 last:border-0 last:pb-0">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const row = await prisma.exercise.findUnique({ where: { slug }, select: { name: true } });

  if (!row) return { title: "Exercício não encontrado" };

  return {
    title: row.name,
    description: `Como executar ${row.name}: passo a passo, dicas de execução, erros comuns, respiração e gasto calórico estimado.`,
  };
}

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const row = await prisma.exercise.findUnique({ where: { slug } });
  if (!row) notFound();

  // Campos JSON (listas) são lidos com o helper do domínio.
  const exercise = {
    ...row,
    secondaryMuscles: parseJsonArray(row.secondaryMuscles),
    instructions: parseJsonArray(row.instructions),
    tips: parseJsonArray(row.tips),
    commonMistakes: parseJsonArray(row.commonMistakes),
  };

  const user = await getCurrentUser();
  const favorites = user ? await prisma.favorite.findMany({ where: { userId: user.id } }) : [];
  const isFavorite = favorites.some((favorite) => favorite.exerciseId === exercise.id);
  const profile = user
    ? await prisma.userProfile.findUnique({
        where: { userId: user.id },
        select: { sex: true },
      })
    : null;
  const media = await getExerciseMedia(row, exercise.slug);

  const impactVariant = IMPACT_VARIANTS[exercise.impact] ?? "default";
  const impactLabel = IMPACT_LABELS[exercise.impact] ?? exercise.impact;
  const calories = exercise.caloriesPerMinute;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      {/* Voltar para a biblioteca */}
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/exercicios">
          <ArrowLeft className="size-4" />
          Biblioteca de exercícios
        </Link>
      </Button>

      {/* Cabeçalho do exercício */}
      <Card className="overflow-hidden border-brand/20 bg-gradient-to-br from-brand/[0.10] to-transparent">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="brand">{muscleLabel(exercise.primaryMuscle)}</Badge>
                <Badge variant="outline">{equipmentLabel(exercise.equipment)}</Badge>
                <Badge>{levelLabel(exercise.difficulty)}</Badge>
                <Badge variant={impactVariant}>Impacto {impactLabel}</Badge>
                <Badge variant="accent">{categoryLabel(exercise.category)}</Badge>
              </div>
              <div className="space-y-1.5">
                <h1 className="font-display text-[clamp(1.9rem,4vw,3rem)] leading-[1.02] tracking-[-0.02em]">
                  {exercise.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Passo a passo, dicas de execução, erros comuns e orientação de respiração.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FavoriteButton
                exerciseId={exercise.id}
                initialFavorite={isFavorite}
                className="bg-background"
              />
              <Button asChild variant="brand" size="lg">
                <Link href={`/treinos/novo?exercicio=${exercise.slug}`}>
                  <ClipboardPlus className="size-4" />
                  Usar em uma ficha
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {media ? (
        <ExerciseMedia
          media={media}
          exerciseName={exercise.name}
          preferredGender={profile?.sex}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Conteúdo principal */}
        <div className="space-y-4 lg:col-span-2">
          {/* Como executar */}
          <Card id="como-executar" className="scroll-mt-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <span className="flex size-8 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  <ListChecks className="size-4" />
                </span>
                Como executar
              </CardTitle>
              <CardDescription>
                Siga a ordem dos passos para manter a técnica e a carga no lugar certo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {exercise.instructions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Este exercício ainda não tem instruções cadastradas.
                </p>
              ) : (
                <ol className="space-y-3.5">
                  {exercise.instructions.map((step, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-bold tabular-nums text-brand">
                        {index + 1}
                      </span>
                      <p className="pt-0.5 text-sm leading-relaxed">{step}</p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          {/* Dicas de execução */}
          {exercise.tips.length > 0 && (
            <Card className="border-brand/20 bg-brand/[0.04]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-brand/15 text-brand">
                    <Lightbulb className="size-4" />
                  </span>
                  Dicas de execução
                </CardTitle>
                <CardDescription>
                  Ajustes que aumentam a eficiência do movimento e poupam as articulações.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {exercise.tips.map((tip, index) => (
                    <li
                      key={index}
                      className="flex gap-3 rounded-xl border border-brand/20 bg-brand/[0.05] p-3.5"
                    >
                      <Lightbulb className="mt-0.5 size-4 shrink-0 text-brand" />
                      <p className="text-sm leading-relaxed">{tip}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Erros comuns */}
          {exercise.commonMistakes.length > 0 && (
            <Card className="border-danger/20 bg-danger/[0.04]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-danger/12 text-danger">
                    <AlertTriangle className="size-4" />
                  </span>
                  Erros comuns
                </CardTitle>
                <CardDescription>
                  O que costuma sair errado — e como corrigir antes de virar lesão.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {exercise.commonMistakes.map((mistake, index) => (
                    <li
                      key={index}
                      className="flex gap-3 rounded-xl border border-danger/20 bg-danger/[0.05] p-3.5"
                    >
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />
                      <p className="text-sm leading-relaxed">{mistake}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Barra lateral */}
        <aside className="space-y-4">
          {/* Respiração */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <span className="flex size-8 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Wind className="size-4" />
                </span>
                Respiração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {exercise.breathing ?? "Respire de forma contínua durante todo o movimento."}
              </p>
            </CardContent>
          </Card>

          {/* Calorias */}
          <StatCard
            icon={Flame}
            label="Gasto calórico"
            value={calories === null ? "—" : calories}
            unit="kcal/min"
            accent="brand"
            hint="Estimativa por minuto de execução"
          />

          {/* Dados rápidos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <span className="flex size-8 items-center justify-center rounded-xl bg-foreground/[0.045] text-muted">
                  <Gauge className="size-4" />
                </span>
                Dados rápidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <DataRow icon={Dumbbell} label="Músculo principal" value={muscleLabel(exercise.primaryMuscle)} />
              <DataRow icon={Layers} label="Equipamento" value={equipmentLabel(exercise.equipment)} />
              <DataRow icon={Zap} label="Nível" value={levelLabel(exercise.difficulty)} />
              <DataRow icon={AlertTriangle} label="Impacto" value={impactLabel} />
              <DataRow icon={Tag} label="Categoria" value={categoryLabel(exercise.category)} />
            </CardContent>
          </Card>

          {/* Músculos secundários */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <span className="flex size-8 items-center justify-center rounded-xl bg-foreground/[0.045] text-muted">
                  <Layers className="size-4" />
                </span>
                Músculos secundários
              </CardTitle>
            </CardHeader>
            <CardContent>
              {exercise.secondaryMuscles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum músculo secundário informado para este exercício.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {exercise.secondaryMuscles.map((muscle) => (
                    <Badge key={muscle} variant="outline">
                      {muscleLabel(muscle)}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chamada para usar na ficha */}
          <Card className="border-brand/25 bg-brand/[0.05]">
            <CardContent className="p-5">
              <p className="text-sm font-medium">Montar um treino com este exercício</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Crie uma ficha de treino e já comece com {exercise.name}.
              </p>
              <Button asChild variant="brand" className="mt-3 w-full">
                <Link href={`/treinos/novo?exercicio=${exercise.slug}`}>
                  Usar em uma ficha
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
