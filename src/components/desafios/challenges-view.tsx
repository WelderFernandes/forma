"use client";

import * as React from "react";
import {
  Award,
  Brain,
  CalendarCheck,
  Droplets,
  Dumbbell,
  Flame,
  Focus,
  Footprints,
  Leaf,
  Moon,
  Mountain,
  Repeat,
  Scale,
  Sparkles,
  Sun,
  Target,
  Trophy,
  TrendingDown,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/primitives";
import { advanceChallenge, startChallenge } from "@/server/actions/wellbeing";
import { formatDate, formatNumber } from "@/lib/utils";

/* ───────────────────────────── Tipos ───────────────────────────── */

export type ChallengeDTO = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  days: number;
  xp: number;
  icon: string;
  color: string;
};

export type UserChallengeDTO = {
  id: string;
  challengeId: string;
  currentDay: number;
  streak: number;
  completedAt: string | null;
  challenge: ChallengeDTO;
};

export type AchievementDTO = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
  category: string;
};

export type UserAchievementDTO = {
  id: string;
  achievementId: string;
  unlockedAt: string;
};

/* ───────────────────────────── Mapas estáticas ───────────────────────────── */

/** Ícones do Lucide usados pelo sistema de desafios e conquistas. */
const ICONS: Record<string, LucideIcon> = {
  "person-standing": Sparkles,
  footprints: Footprints,
  dumbbell: Dumbbell,
  leaf: Leaf,
  utensils: Utensils,
  "calendar-check": CalendarCheck,
  sun: Sun,
  droplets: Droplets,
  moon: Moon,
  brain: Brain,
  flame: Flame,
  trophy: Trophy,
  award: Award,
  "trending-down": TrendingDown,
  target: Target,
  repeat: Repeat,
  mountain: Mountain,
  focus: Focus,
  scale: Scale,
};

function resolveIcon(name: string): LucideIcon {
  return ICONS[name] ?? Sparkles;
}

const COLOR_CLASSES: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  lime: "bg-lime-500/15 text-lime-600 dark:text-lime-400",
  orange: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  violet: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  sky: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  indigo: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  teal: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
};

function colorClass(color: string): string {
  return COLOR_CLASSES[color] ?? "bg-brand/15 text-brand";
}

const CHALLENGE_CATEGORY_LABELS: Record<string, string> = {
  movimento: "Movimento",
  alimentacao: "Alimentação",
  habito: "Hábito",
  recuperacao: "Recuperação",
  mental: "Mental",
};

const ACHIEVEMENT_CATEGORY_LABELS: Record<string, string> = {
  treino: "Treino",
  constancia: "Constância",
  corpo: "Corpo",
  nutricao: "Nutrição",
  especial: "Especial",
};

/* ───────────────────────────── Tela ───────────────────────────── */

export function ChallengesView({
  challenges,
  userChallenges,
  achievements,
  unlocked,
}: {
  challenges: ChallengeDTO[];
  userChallenges: UserChallengeDTO[];
  achievements: AchievementDTO[];
  unlocked: UserAchievementDTO[];
}) {
  const [pending, startTransition] = React.useTransition();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const progressByChallenge = React.useMemo(() => {
    const map = new Map<string, UserChallengeDTO>();
    for (const item of userChallenges) map.set(item.challengeId, item);
    return map;
  }, [userChallenges]);

  const unlockedIds = React.useMemo(
    () => new Set(unlocked.map((item) => item.achievementId)),
    [unlocked],
  );

  function run(id: string, action: () => Promise<unknown>) {
    setMessage(null);
    setActiveId(id);
    startTransition(async () => {
      try {
        await action();
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Não foi possível concluir a ação.",
        );
      } finally {
        setActiveId(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Constância"
        title="Desafios"
        description="Sequências curtas e consistentes para transformar intenção em rotina."
      />

      {message && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {message}
        </p>
      )}

      {/* Desafios do sistema */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold tracking-tight">Desafios disponíveis</h2>
        {challenges.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Nenhum desafio cadastrado"
            description="Os desafios do sistema aparecem aqui assim que o banco de dados for populado."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {challenges.map((challenge) => {
              const Icon = resolveIcon(challenge.icon);
              const progress = progressByChallenge.get(challenge.id);
              const completed = Boolean(progress?.completedAt);
              const percent =
                progress && challenge.days > 0
                  ? Math.min(100, Math.round((progress.currentDay / challenge.days) * 100))
                  : 0;

              return (
                <Card key={challenge.id} className="flex flex-col">
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${colorClass(challenge.color)}`}
                      >
                        <Icon className="size-5" />
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {CHALLENGE_CATEGORY_LABELS[challenge.category] ?? challenge.category}
                      </Badge>
                    </div>
                    <CardTitle>{challenge.title}</CardTitle>
                    <CardDescription>{challenge.description}</CardDescription>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <Badge variant="brand" className="text-[10px]">
                        {challenge.days} dias
                      </Badge>
                      <Badge variant="accent" className="text-[10px]">
                        {challenge.xp} XP
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="mt-auto space-y-3">
                    {progress && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="tabular-nums">
                            Dia {Math.min(progress.currentDay, challenge.days)} de {challenge.days}
                          </span>
                          <span className="text-muted-foreground">
                            {progress.streak} {progress.streak === 1 ? "dia" : "dias"} seguidos
                          </span>
                        </div>
                        <Progress value={percent} />
                      </div>
                    )}

                    {completed ? (
                      <Badge variant="success" className="w-full justify-center py-1">
                        <Award className="size-3" />
                        Concluído
                      </Badge>
                    ) : (
                      <Button
                        variant={progress ? "brand" : "outline"}
                        size="sm"
                        className="w-full"
                        loading={pending && activeId === challenge.id}
                        onClick={() =>
                          run(challenge.id, () =>
                            progress
                              ? advanceChallenge(challenge.id)
                              : startChallenge(challenge.id),
                          )
                        }
                      >
                        {progress ? "Marcar dia concluído" : "Iniciar desafio"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Meus desafios */}
        <Card>
          <CardHeader>
            <CardTitle>Meus desafios</CardTitle>
            <CardDescription>Seu progresso nos desafios em andamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {userChallenges.length === 0 ? (
              <EmptyState
                icon={Target}
                title="Você ainda não começou nenhum desafio"
                description="Escolha um desafio acima e marque o primeiro dia para começar a contar."
              />
            ) : (
              userChallenges.map((item) => {
                const Icon = resolveIcon(item.challenge.icon);
                const completed = Boolean(item.completedAt);
                const percent =
                  item.challenge.days > 0
                    ? Math.min(100, Math.round((item.currentDay / item.challenge.days) * 100))
                    : 0;

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border bg-surface p-3.5"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${colorClass(item.challenge.color)}`}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">{item.challenge.title}</p>
                          {completed && (
                            <Badge variant="success" className="text-[10px]">
                              Concluído
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Dia {Math.min(item.currentDay, item.challenge.days)} de {item.challenge.days}
                          {" · "}
                          {item.streak} {item.streak === 1 ? "dia seguido" : "dias seguidos"}
                        </p>
                        <div className="mt-2 space-y-1.5">
                          <Progress value={percent} />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button
                            variant="brand"
                            size="sm"
                            disabled={completed}
                            loading={pending && activeId === item.challengeId}
                            onClick={() =>
                              run(item.challengeId, () => advanceChallenge(item.challengeId))
                            }
                          >
                            Marcar dia concluído
                          </Button>
                          <Badge variant="outline" className="text-[10px]">
                            +{item.challenge.xp} XP ao concluir
                          </Badge>
                          {item.completedAt && (
                            <span className="text-xs text-muted-foreground">
                              Concluído em {formatDate(item.completedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Conquistas */}
        <Card>
          <CardHeader>
            <CardTitle>Conquistas</CardTitle>
            <CardDescription>
              {unlocked.length} de {achievements.length} desbloqueadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {achievements.length === 0 ? (
              <EmptyState
                icon={Award}
                title="Nenhuma conquista cadastrada"
                description="As conquistas do sistema aparecem aqui assim que o banco de dados for populado."
              />
            ) : (
              achievements.map((achievement) => {
                const Icon = resolveIcon(achievement.icon);
                const isUnlocked = unlockedIds.has(achievement.id);
                return (
                  <div
                    key={achievement.id}
                    className={`flex items-start gap-3 rounded-xl border p-3 ${
                      isUnlocked
                        ? "border-brand/25 bg-brand/[0.05]"
                        : "border-border bg-surface opacity-70"
                    }`}
                  >
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                        isUnlocked
                          ? "bg-brand/15 text-brand"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{achievement.title}</p>
                        <Badge
                          variant={isUnlocked ? "success" : "outline"}
                          className="text-[10px]"
                        >
                          {isUnlocked ? "Desbloqueada" : "Bloqueada"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {achievement.description}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          {ACHIEVEMENT_CATEGORY_LABELS[achievement.category] ??
                            achievement.category}
                        </Badge>
                        <Badge variant="accent" className="text-[10px]">
                          {formatNumber(achievement.xp)} XP
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
