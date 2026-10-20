"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/server/auth-helpers";
import { generatePlan, type PlanInput } from "@/lib/domain/plan-generator";
import { resolvePlanSlots } from "@/server/plan";
import { createGeneratedTemplate } from "@/server/onboarding";

const previewSchema = z.object({
  goal: z.string().nullable().optional(),
  level: z.string().nullable().optional(),
  equipment: z.array(z.string()).default([]),
  daysPerWeek: z.coerce.number().int().min(2).max(6).default(3),
  sessionMinutes: z.coerce.number().int().min(10).max(120).default(35),
  focusAreas: z.array(z.string()).default([]),
  lowImpact: z.boolean().default(false),
});

export type PlanPreview = {
  name: string;
  description: string;
  split: string;
  daysPerWeek: number;
  estMinutes: number;
  rationale: string;
  items: {
    key: string;
    label: string;
    exerciseName: string;
    exerciseId: string;
    slug: string;
    equipment: string;
    primaryMuscle: string;
    sets: number;
    reps: string;
    restSeconds: number;
    rpe?: number;
    tempo?: string;
    notes?: string;
    supersetGroup?: string;
  }[];
};

/** Gera o plano sob medida a partir de um rascunho (usado no preview do wizard). */
export async function previewPlan(
  draft: z.infer<typeof previewSchema>,
): Promise<PlanPreview> {
  await requireUserId();
  const data = previewSchema.parse(draft);

  const plan = generatePlan({
    goal: data.goal,
    level: data.level as PlanInput["level"],
    equipment: data.equipment as PlanInput["equipment"],
    daysPerWeek: data.daysPerWeek,
    sessionMinutes: data.sessionMinutes,
    focusAreas: data.focusAreas,
    lowImpact: data.lowImpact,
  });

  const resolved = await resolvePlanSlots(plan.slots, {
    level: data.level,
    equipment: data.equipment,
  });

  return {
    name: plan.name,
    description: plan.description,
    split: plan.split,
    daysPerWeek: plan.daysPerWeek,
    estMinutes: plan.estMinutes,
    rationale: plan.rationale,
    items: resolved.map(({ slot, exercise }) => ({
      key: slot.key,
      label: slot.label,
      exerciseName: exercise?.name ?? "Exercício não encontrado",
      exerciseId: exercise?.id ?? "",
      slug: exercise?.slug ?? "",
      equipment: exercise?.equipment ?? "none",
      primaryMuscle: exercise?.primaryMuscle ?? slot.muscle,
      sets: slot.sets,
      reps: slot.reps,
      restSeconds: slot.restSeconds,
      rpe: slot.rpe,
      tempo: slot.tempo,
      notes: slot.note,
      supersetGroup: slot.supersetGroup,
    })),
  };
}

/** Gera o plano a partir do perfil salvo e grava como ficha do usuário. */
export async function generatePlanFromProfile(): Promise<{ ok: boolean; templateId?: string }> {
  const userId = await requireUserId();

  const { template } = await createGeneratedTemplate(userId);

  revalidatePath("/treinos");
  revalidatePath("/painel");
  return { ok: true, templateId: template.id };
}
