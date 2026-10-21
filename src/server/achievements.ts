import "server-only";
import prisma from "@/lib/prisma";
import { currentStreak, longestStreak } from "@/lib/domain/insights";
import { daysBetween } from "@/lib/utils";

/**
 * Verifica e desbloqueia conquistas com base no estado atual do usuário.
 * Roda após eventos relevantes (treino concluído, medida registrada, etc).
 * Retorna os slugs recém-desbloqueados.
 */
export async function syncAchievements(userId: string): Promise<string[]> {
  const [achievements, unlocked, sessions, bodyMetrics, waterLogs, mealEntries] =
    await Promise.all([
      prisma.achievement.findMany(),
      prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
      }),
      prisma.workoutSession.findMany({
        where: { userId },
        include: { items: { include: { sets: true, exercise: true } } },
      }),
      prisma.bodyMetric.findMany({ where: { userId }, orderBy: { date: "asc" } }),
      prisma.waterLog.findMany({ where: { userId } }),
      prisma.mealEntry.findMany({ where: { userId } }),
    ]);

  const unlockedSlugs = new Set(unlocked.map((u) => u.achievement.slug));
  const completed = sessions.filter((s) => s.status === "completed");

  const summaries = completed.map((s) => ({
    id: s.id,
    name: s.name,
    startedAt: s.startedAt,
    completedAt: s.completedAt,
    durationSeconds: s.durationSeconds,
    status: s.status,
    items: [],
  }));

  const streak = currentStreak(summaries);
  const best = Math.max(streak, longestStreak(summaries));

  const distinctTrainingDays = new Set(
    completed.map((s) => s.startedAt.toDateString()),
  ).size;

  const muscleGroups = new Set(
    completed.flatMap((s) => s.items.map((i) => i.exercise.primaryMuscle)),
  ).size;

  const hasNightSession = completed.some((s) => {
    const hour = s.startedAt.getHours();
    return hour >= 18 || hour < 5;
  });

  const hasEarlySession = completed.some((s) => {
    const hour = s.startedAt.getHours();
    return hour >= 4 && hour < 9;
  });

  const prCount = completed.reduce(
    (acc, s) =>
      acc + s.items.reduce((a, item) => a + item.sets.filter((set) => set.isPr).length, 0),
    0,
  );

  const waterMl = waterLogs.reduce((acc, w) => acc + w.amountMl, 0);

  // Recorde de peso: o menor peso registrado é menor que o primeiro
  const weights = bodyMetrics
    .filter((b) => b.weightKg)
    .map((b) => b.weightKg as number);
  const hasWeightPr =
    weights.length >= 2 && Math.min(...weights) < weights[0] - 0.5;

  // Dias dentro da meta calórica
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  const target = profile?.targetCalories ?? null;
  let daysOnCalorieTarget = 0;
  if (target) {
    const byDay = new Map<string, number>();
    for (const meal of mealEntries) {
      const key = meal.date.toDateString();
      byDay.set(key, (byDay.get(key) ?? 0) + meal.calories);
    }
    daysOnCalorieTarget = Array.from(byDay.values()).filter(
      (cal) => cal >= target * 0.85 && cal <= target * 1.1,
    ).length;
  }

  const conditions: Record<string, boolean> = {
    // Treino
    "primeiro-treino": completed.length >= 1,
    "cinquenta-treinos": completed.length >= 50,
    "cem-treinos": completed.length >= 100,
    "multiplas-sessoes": distinctTrainingDays >= 20,
    "foco-total": completed.length >= 25 && distinctTrainingDays >= 20,
    "equilibrio": muscleGroups >= 5,
    "maratonista": completed.length >= 42,
    "treino-noturno": hasNightSession,
    "madrugador": hasEarlySession,
    // Constância
    "sequencia-de-7-dias": best >= 7,
    "sequencia-de-30-dias": best >= 30,
    // Corpo e nutrição
    "novo-recorde-de-peso": hasWeightPr,
    "meta-de-calorias": daysOnCalorieTarget >= 3,
    "hidratacao-em-dia": waterMl >= 5000,
  };

  const toUnlock = achievements.filter(
    (a) => !unlockedSlugs.has(a.slug) && conditions[a.slug],
  );

  if (toUnlock.length > 0) {
    // Filtramos antes para manter a operação idempotente e portátil.
    await prisma.userAchievement.createMany({
      data: toUnlock.map((a) => ({ userId, achievementId: a.id })),
    });
  }

  void prCount;
  void daysBetween;
  return toUnlock.map((a) => a.slug);
}
