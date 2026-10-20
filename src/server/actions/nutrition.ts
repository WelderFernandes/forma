"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireUserId } from "@/server/auth-helpers";
import { syncAchievements } from "@/server/achievements";

/* ───────────────────────────── Alimentação ───────────────────────────── */

const mealSchema = z.object({
  meal: z.enum(["breakfast", "lunch", "snack", "dinner"]),
  name: z.string().min(1, "Informe o alimento").max(120),
  serving: z.string().max(80).optional(),
  calories: z.coerce.number().int().min(0).max(5000),
  protein: z.coerce.number().min(0).max(300).default(0),
  carbs: z.coerce.number().min(0).max(500).default(0),
  fat: z.coerce.number().min(0).max(300).default(0),
  date: z.coerce.date().optional(),
});

export async function addMealEntry(input: z.infer<typeof mealSchema>) {
  const userId = await requireUserId();
  const data = mealSchema.parse(input);

  await prisma.mealEntry.create({
    data: {
      userId,
      date: data.date ?? new Date(),
      meal: data.meal,
      name: data.name,
      serving: data.serving ?? null,
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
    },
  });

  revalidatePath("/nutricao");
  return { ok: true };
}

export async function deleteMealEntry(id: string) {
  const userId = await requireUserId();
  await prisma.mealEntry.deleteMany({ where: { id, userId } });
  revalidatePath("/nutricao");
  return { ok: true };
}

/* ───────────────────────────── Água ───────────────────────────── */

export async function logWater(amountMl: number) {
  const userId = await requireUserId();
  const now = new Date();
  now.setHours(12, 0, 0, 0);

  await prisma.waterLog.create({
    data: { userId, date: now, amountMl: Math.round(amountMl) },
  });

  await syncAchievements(userId);

  revalidatePath("/nutricao");
  return { ok: true };
}

/* ───────────────────────────── Passos ───────────────────────────── */

export async function logSteps(steps: number) {
  const userId = await requireUserId();
  const now = new Date();
  now.setHours(12, 0, 0, 0);

  await prisma.stepLog.upsert({
    where: { userId_date: { userId, date: now } },
    create: { userId, date: now, steps: Math.round(steps) },
    update: { steps: Math.round(steps) },
  });

  revalidatePath("/nutricao");
  revalidatePath("/progresso");
  return { ok: true };
}

/* ───────────────────────────── Jejum ───────────────────────────── */

export async function startFasting(targetHours: number) {
  const userId = await requireUserId();

  const active = await prisma.fastingSession.findFirst({
    where: { userId, status: "active" },
  });
  if (active) throw new Error("Já existe um jejum em andamento");

  await prisma.fastingSession.create({
    data: { userId, targetHours, startedAt: new Date() },
  });

  revalidatePath("/nutricao");
  return { ok: true };
}

export async function stopFasting() {
  const userId = await requireUserId();
  await prisma.fastingSession.updateMany({
    where: { userId, status: "active" },
    data: { endedAt: new Date(), status: "completed" },
  });
  revalidatePath("/nutricao");
  return { ok: true };
}

/* ───────────────────────────── Medidas corporais ───────────────────────────── */

const bodySchema = z.object({
  date: z.coerce.date().optional(),
  weightKg: z.coerce.number().min(30).max(350).optional(),
  bodyFatPct: z.coerce.number().min(2).max(70).optional(),
  chestCm: z.coerce.number().min(40).max(250).optional(),
  waistCm: z.coerce.number().min(30).max(250).optional(),
  hipCm: z.coerce.number().min(40).max(250).optional(),
  armCm: z.coerce.number().min(15).max(90).optional(),
  thighCm: z.coerce.number().min(30).max(150).optional(),
  notes: z.string().max(400).optional(),
});

export async function saveBodyMetric(input: z.infer<typeof bodySchema>) {
  const userId = await requireUserId();
  const data = bodySchema.parse(input);

  const date = data.date ?? new Date();
  date.setHours(12, 0, 0, 0);

  await prisma.bodyMetric.upsert({
    where: { userId_date: { userId, date } },
    create: {
      userId,
      date,
      weightKg: data.weightKg ?? null,
      bodyFatPct: data.bodyFatPct ?? null,
      chestCm: data.chestCm ?? null,
      waistCm: data.waistCm ?? null,
      hipCm: data.hipCm ?? null,
      armCm: data.armCm ?? null,
      thighCm: data.thighCm ?? null,
      notes: data.notes ?? null,
    },
    update: {
      ...(data.weightKg !== undefined ? { weightKg: data.weightKg } : {}),
      ...(data.bodyFatPct !== undefined ? { bodyFatPct: data.bodyFatPct } : {}),
      ...(data.chestCm !== undefined ? { chestCm: data.chestCm } : {}),
      ...(data.waistCm !== undefined ? { waistCm: data.waistCm } : {}),
      ...(data.hipCm !== undefined ? { hipCm: data.hipCm } : {}),
      ...(data.armCm !== undefined ? { armCm: data.armCm } : {}),
      ...(data.thighCm !== undefined ? { thighCm: data.thighCm } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    },
  });

  if (data.weightKg) {
    await prisma.userProfile.updateMany({
      where: { userId },
      data: { weightKg: data.weightKg },
    });
  }

  // Conquistas de corpo (novo recorde de peso) podem ter sido desbloqueadas.
  await syncAchievements(userId);

  revalidatePath("/corpo");
  revalidatePath("/progresso");
  return { ok: true };
}
