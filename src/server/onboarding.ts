import "server-only";
import prisma from "@/lib/prisma";
import { toJsonArray } from "@/lib/domain/types";
import {
  adjustCalories,
  calculateBmr,
  calculateMacros,
  calculateTdee,
} from "@/lib/domain/calculators";
import { generatePlan, type PlanInput } from "@/lib/domain/plan-generator";
import { resolvePlanSlots } from "@/server/plan";
import { parseJsonArray } from "@/lib/domain/types";

export type OnboardingData = {
  sex: "female" | "male" | "other";
  birthDate: string;
  heightCm: number;
  weightKg: number;
  goal: string;
  level: "beginner" | "intermediate" | "advanced";
  equipment: string[];
  daysPerWeek: number;
  sessionMinutes: number;
  focusAreas: string[];
  lowImpact: boolean;
  activity: "sedentary" | "light" | "moderate" | "active" | "athlete";
};

export type OnboardingResult = {
  bmr: number;
  tdee: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

/** Calcula idade em anos a partir da data de nascimento. */
function ageFrom(birthDate: Date): number {
  return Math.max(
    12,
    Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
  );
}

/**
 * Grava o perfil do usuário e calcula as metas nutricionais.
 * Compartilhado entre a Server Action e a rota de API.
 */
export async function applyOnboarding(
  userId: string,
  data: OnboardingData,
): Promise<OnboardingResult> {
  const birthDate = new Date(data.birthDate);
  const age = ageFrom(birthDate);

  const { bmr } = calculateBmr({
    sex: data.sex,
    weightKg: data.weightKg,
    heightCm: data.heightCm,
    age,
  });
  const { tdee } = calculateTdee({ bmr, activity: data.activity });
  const adjustment = adjustCalories(tdee, data.goal);
  const macros = calculateMacros({
    calories: adjustment.calories,
    weightKg: data.weightKg,
    goal: data.goal,
  });

  const profileData = {
    onboarded: true,
    sex: data.sex,
    birthDate,
    heightCm: data.heightCm,
    weightKg: data.weightKg,
    goal: data.goal,
    level: data.level,
    activity: data.activity,
    equipment: toJsonArray(data.equipment),
    daysPerWeek: data.daysPerWeek,
    sessionMinutes: data.sessionMinutes,
    focusAreas: toJsonArray(data.focusAreas),
    lowImpact: data.lowImpact,
    targetCalories: macros.calories,
    targetProtein: macros.protein,
    targetCarbs: macros.carbs,
    targetFat: macros.fat,
  };

  await prisma.userProfile.upsert({
    where: { userId },
    create: { userId, ...profileData },
    update: profileData,
  });

  // Primeira medida de peso para a curva de progresso.
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  await prisma.bodyMetric.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, date: today, weightKg: data.weightKg },
    update: { weightKg: data.weightKg },
  });

  return {
    bmr,
    tdee,
    calories: macros.calories,
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat,
  };
}

/**
 * Gera a ficha de treino a partir do perfil salvo.
 * Compartilhado entre a Server Action e a rota de API.
 */
export async function createGeneratedTemplate(userId: string) {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Perfil não encontrado");

  const equipment = parseJsonArray(profile.equipment);
  const plan = generatePlan({
    goal: profile.goal,
    level: profile.level as PlanInput["level"],
    equipment: equipment as PlanInput["equipment"],
    daysPerWeek: profile.daysPerWeek,
    sessionMinutes: profile.sessionMinutes,
    focusAreas: parseJsonArray(profile.focusAreas),
    lowImpact: profile.lowImpact,
  });

  const resolved = await resolvePlanSlots(plan.slots, {
    level: profile.level,
    equipment,
  });

  const valid = resolved.filter(
    (r): r is { slot: PlanSlot["slot"]; exercise: NonNullable<PlanSlot["exercise"]> } =>
      r.exercise !== null,
  );
  if (valid.length === 0) throw new Error("Nenhum exercício compatível encontrado");

  const template = await prisma.workoutTemplate.create({
    data: {
      userId,
      name: plan.name,
      description: `${plan.description}\n\n${plan.rationale}`,
      split: plan.split,
      goal: profile.goal,
      level: profile.level,
      equipment: profile.equipment,
      daysPerWeek: plan.daysPerWeek,
      estMinutes: plan.estMinutes,
      tags: JSON.stringify(["gerado", plan.split]),
      items: {
        create: valid.map(({ slot, exercise }, index) => ({
          exerciseId: exercise.id,
          order: index,
          sets: slot.sets,
          reps: slot.reps,
          restSeconds: slot.restSeconds,
          rpe: slot.rpe ?? null,
          tempo: slot.tempo ?? null,
          notes: slot.note ?? null,
          supersetGroup: slot.supersetGroup ?? null,
        })),
      },
    },
  });

  return { template, plan, resolved: valid };
}

type PlanSlot = Awaited<ReturnType<typeof resolvePlanSlots>>[number];
