"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireUserId } from "@/server/auth-helpers";
import { toJsonArray } from "@/lib/domain/types";
import {
  adjustCalories,
  calculateBmr,
  calculateMacros,
  calculateTdee,
} from "@/lib/domain/calculators";
import { normalizeTrainingDays } from "@/lib/domain/schedule";
import { applyOnboarding } from "@/server/onboarding";

const onboardingSchema = z.object({
  sex: z.enum(["female", "male", "other"]),
  birthDate: z.string().min(4),
  heightCm: z.coerce.number().min(100).max(250),
  weightKg: z.coerce.number().min(30).max(350),
  goal: z.string().min(1),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  equipment: z.array(z.string()).max(12),
  daysPerWeek: z.coerce.number().int().min(2).max(6),
  trainingDays: z
    .array(z.coerce.number().int().min(1).max(7))
    .max(7)
    .optional(),
  sessionMinutes: z.coerce.number().int().min(10).max(120),
  focusAreas: z.array(z.string()).max(10),
  lowImpact: z.boolean().default(false),
  activity: z.enum(["sedentary", "light", "moderate", "active", "athlete"]),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export async function completeOnboarding(input: OnboardingInput) {
  const userId = await requireUserId();
  const data = onboardingSchema.parse(input);

  const result = await applyOnboarding(userId, data);

  revalidatePath("/");
  revalidatePath("/progresso");
  revalidatePath("/nutricao");
  return { ok: true, ...result };
}

const profileSchema = z.object({
  sex: z.enum(["female", "male", "other"]).optional(),
  heightCm: z.coerce.number().min(100).max(250).optional(),
  weightKg: z.coerce.number().min(30).max(350).optional(),
  goal: z.string().optional(),
  level: z.string().optional(),
  daysPerWeek: z.coerce.number().int().min(2).max(6).optional(),
  trainingDays: z
    .array(z.coerce.number().int().min(1).max(7))
    .max(7)
    .optional(),
  sessionMinutes: z.coerce.number().int().min(10).max(120).optional(),
  equipment: z.array(z.string()).optional(),
  focusAreas: z.array(z.string()).optional(),
  lowImpact: z.boolean().optional(),
  activity: z.enum(["sedentary", "light", "moderate", "active", "athlete"]).optional(),
  waterTargetMl: z.coerce.number().int().min(500).max(6000).optional(),
  stepTarget: z.coerce.number().int().min(1000).max(30000).optional(),
  fastingEnabled: z.boolean().optional(),
  fastingHours: z.coerce.number().int().min(12).max(24).optional(),
});

export async function updateProfile(input: z.infer<typeof profileSchema>) {
  const userId = await requireUserId();
  const data = profileSchema.parse(input);

  const current = await prisma.userProfile.findUnique({ where: { userId } });
  const nextDaysPerWeek = data.daysPerWeek ?? current?.daysPerWeek ?? 3;
  const shouldUpdateTrainingDays =
    data.trainingDays !== undefined || data.daysPerWeek !== undefined;
  const trainingDays = shouldUpdateTrainingDays
    ? normalizeTrainingDays(
        data.trainingDays ?? current?.trainingDays,
        nextDaysPerWeek,
      )
    : null;

  // Recalcula as metas nutricionais quando peso/objetivo/atividade mudam.
  let nutritionUpdate: Record<string, number> = {};
  if (current && (data.weightKg || data.goal || data.activity)) {
    const weightKg = data.weightKg ?? current.weightKg ?? 70;
    const goal = data.goal ?? current.goal;
    const activity = data.activity ?? current.activity ?? "moderate";
    const age = current.birthDate
      ? Math.max(
          12,
          Math.floor(
            (Date.now() - current.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
          ),
        )
      : 30;
    const { bmr } = calculateBmr({
      sex: (current.sex as "male" | "female" | "other") ?? "other",
      weightKg,
      heightCm: data.heightCm ?? current.heightCm ?? 170,
      age,
    });
    const { tdee } = calculateTdee({
      bmr,
      activity: activity as
        | "sedentary"
        | "light"
        | "moderate"
        | "active"
        | "athlete",
    });
    const adjustment = adjustCalories(tdee, goal);
    const macros = calculateMacros({ calories: adjustment.calories, weightKg, goal });
    nutritionUpdate = {
      targetCalories: macros.calories,
      targetProtein: macros.protein,
      targetCarbs: macros.carbs,
      targetFat: macros.fat,
    };
  }

  await prisma.userProfile.update({
    where: { userId },
    data: {
      ...(data.sex !== undefined ? { sex: data.sex } : {}),
      ...(data.heightCm !== undefined ? { heightCm: data.heightCm } : {}),
      ...(data.weightKg !== undefined ? { weightKg: data.weightKg } : {}),
      ...(data.goal !== undefined ? { goal: data.goal } : {}),
      ...(data.level !== undefined ? { level: data.level } : {}),
      ...(data.activity !== undefined ? { activity: data.activity } : {}),
      ...(data.daysPerWeek !== undefined ? { daysPerWeek: data.daysPerWeek } : {}),
      ...(trainingDays
        ? { trainingDays: JSON.stringify(trainingDays) }
        : {}),
      ...(data.sessionMinutes !== undefined ? { sessionMinutes: data.sessionMinutes } : {}),
      ...(data.equipment !== undefined ? { equipment: toJsonArray(data.equipment) } : {}),
      ...(data.focusAreas !== undefined ? { focusAreas: toJsonArray(data.focusAreas) } : {}),
      ...(data.lowImpact !== undefined ? { lowImpact: data.lowImpact } : {}),
      ...(data.waterTargetMl !== undefined ? { waterTargetMl: data.waterTargetMl } : {}),
      ...(data.stepTarget !== undefined ? { stepTarget: data.stepTarget } : {}),
      ...(data.fastingEnabled !== undefined ? { fastingEnabled: data.fastingEnabled } : {}),
      ...(data.fastingHours !== undefined ? { fastingHours: data.fastingHours } : {}),
      ...nutritionUpdate,
    },
  });

  revalidatePath("/");
  revalidatePath("/configuracoes");
  revalidatePath("/painel");
  revalidatePath("/treinos");
  revalidatePath("/cardio");
  revalidatePath("/nutricao");
  return { ok: true };
}
