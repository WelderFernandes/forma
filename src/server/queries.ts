import "server-only";
import prisma from "@/lib/prisma";
import { parseJsonArray } from "@/lib/domain/types";

/* ───────────────────────────── Exercícios ───────────────────────────── */

export async function getExercises(options?: {
  muscle?: string;
  equipment?: string;
  category?: string;
  difficulty?: string;
  search?: string;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};

  if (options?.muscle) where.primaryMuscle = options.muscle;
  if (options?.equipment) where.equipment = options.equipment;
  if (options?.category) where.category = options.category;
  if (options?.difficulty) where.difficulty = options.difficulty;
  if (options?.search) {
    where.name = { contains: options.search, mode: "insensitive" };
  }

  const rows = await prisma.exercise.findMany({
    where,
    orderBy: { name: "asc" },
    take: options?.limit ?? 200,
  });

  return rows.map((row) => ({
    ...row,
    secondaryMuscles: parseJsonArray(row.secondaryMuscles),
    instructions: parseJsonArray(row.instructions),
    tips: parseJsonArray(row.tips),
    commonMistakes: parseJsonArray(row.commonMistakes),
  }));
}

export type ExerciseDTO = Awaited<ReturnType<typeof getExercises>>[number];

/* ───────────────────────────── Fichas ───────────────────────────── */

export async function getTemplates(userId: string) {
  const rows = await prisma.workoutTemplate.findMany({
    where: { OR: [{ userId }, { isSystem: true }] },
    include: {
      items: {
        include: { exercise: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: [{ isSystem: "desc" }, { createdAt: "desc" }],
  });

  return rows.map((row) => ({
    ...row,
    equipment: parseJsonArray(row.equipment),
    tags: parseJsonArray(row.tags),
    items: row.items.map((item) => ({
      ...item,
      exercise: {
        ...item.exercise,
        secondaryMuscles: parseJsonArray(item.exercise.secondaryMuscles),
        instructions: parseJsonArray(item.exercise.instructions),
        tips: parseJsonArray(item.exercise.tips),
        commonMistakes: parseJsonArray(item.exercise.commonMistakes),
      },
    })),
  }));
}

export type TemplateDTO = Awaited<ReturnType<typeof getTemplates>>[number];

/* ───────────────────────────── Sessões ───────────────────────────── */

export async function getSessions(userId: string, limit = 60) {
  const rows = await prisma.workoutSession.findMany({
    where: { userId },
    include: {
      template: { select: { id: true, name: true, split: true } },
      items: {
        include: { exercise: true, sets: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { startedAt: "desc" },
    take: limit,
  });

  return rows.map((row) => ({
    ...row,
    items: row.items.map((item) => ({
      ...item,
      exercise: {
        ...item.exercise,
        secondaryMuscles: parseJsonArray(item.exercise.secondaryMuscles),
        instructions: parseJsonArray(item.exercise.instructions),
        tips: parseJsonArray(item.exercise.tips),
        commonMistakes: parseJsonArray(item.exercise.commonMistakes),
      },
    })),
  }));
}

export type SessionDTO = Awaited<ReturnType<typeof getSessions>>[number];

/* ───────────────────────────── Perfil ───────────────────────────── */

export async function getProfile(userId: string) {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile) return null;
  return {
    ...profile,
    equipment: parseJsonArray(profile.equipment),
    focusAreas: parseJsonArray(profile.focusAreas),
    trainingDays: parseJsonArray<number>(profile.trainingDays)
      .filter((day) => Number.isInteger(day) && day >= 1 && day <= 7)
      .sort((a, b) => a - b),
  };
}

export type ProfileDTO = Awaited<ReturnType<typeof getProfile>>;

/* ───────────────────────────── Cardio ao ar livre ───────────────────────────── */

export async function getCardioSessions(
  userId: string,
  options?: { from?: Date; to?: Date; limit?: number },
) {
  return prisma.cardioSession.findMany({
    where: {
      userId,
      ...(options?.from || options?.to
        ? {
            date: {
              ...(options.from ? { gte: options.from } : {}),
              ...(options.to ? { lt: options.to } : {}),
            },
          }
        : {}),
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    take: options?.limit ?? 250,
  });
}

export type CardioSessionDTO = Awaited<ReturnType<typeof getCardioSessions>>[number];

/* ───────────────────────────── Medidas corporais ───────────────────────────── */

export async function getBodyMetrics(userId: string, limit = 120) {
  return prisma.bodyMetric.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit,
  });
}

/* ───────────────────────────── Nutrição ───────────────────────────── */

export async function getNutritionDay(userId: string, date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [meals, water, steps] = await Promise.all([
    prisma.mealEntry.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { date: "asc" },
    }),
    prisma.waterLog.findMany({ where: { userId, date: { gte: start, lt: end } } }),
    prisma.stepLog.findUnique({ where: { userId_date: { userId, date: start } } }),
  ]);

  return { meals, water, steps };
}

/* ───────────────────────────── Conquistas e desafios ───────────────────────────── */

export async function getUserAchievements(userId: string) {
  return prisma.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
    orderBy: { unlockedAt: "desc" },
  });
}

export async function getUserChallenges(userId: string) {
  return prisma.userChallenge.findMany({
    where: { userId },
    include: { challenge: true },
    orderBy: { startedAt: "desc" },
  });
}
