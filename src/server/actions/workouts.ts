"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireUserId } from "@/server/auth-helpers";
import { toJsonArray } from "@/lib/domain/types";
import { slugify } from "@/lib/utils";
import { syncAchievements } from "@/server/achievements";

/* ───────────────────────────── Fichas ───────────────────────────── */

const templateItemSchema = z.object({
  exerciseId: z.string().min(1),
  sets: z.coerce.number().int().min(1).max(20),
  reps: z.string().min(1).max(20),
  restSeconds: z.coerce.number().int().min(0).max(900),
  rpe: z.coerce.number().int().min(1).max(10).optional().nullable(),
  tempo: z.string().max(20).optional().nullable(),
  notes: z.string().max(400).optional().nullable(),
  supersetGroup: z.string().max(40).optional().nullable(),
});

const templateSchema = z.object({
  name: z.string().min(2, "Dê um nome à ficha").max(80),
  description: z.string().max(600).optional().nullable(),
  split: z.string().max(40).default("full_body"),
  goal: z.string().max(40).optional().nullable(),
  level: z.string().max(40).optional().nullable(),
  equipment: z.array(z.string()).max(12).default([]),
  daysPerWeek: z.coerce.number().int().min(1).max(7).optional().nullable(),
  estMinutes: z.coerce.number().int().min(5).max(240).default(35),
  tags: z.array(z.string()).max(12).default([]),
  items: z.array(templateItemSchema).min(1, "Adicione ao menos um exercício"),
});

export type TemplateInput = z.infer<typeof templateSchema>;

export async function saveTemplate(input: TemplateInput & { id?: string }) {
  const userId = await requireUserId();
  const data = templateSchema.parse(input);

  const payload = {
    name: data.name,
    description: data.description ?? null,
    split: data.split,
    goal: data.goal ?? null,
    level: data.level ?? null,
    equipment: toJsonArray(data.equipment),
    daysPerWeek: data.daysPerWeek ?? null,
    estMinutes: data.estMinutes,
    tags: toJsonArray(data.tags),
  };

  if (input.id) {
    const templateId = input.id;
    const existing = await prisma.workoutTemplate.findFirst({
      where: { id: templateId, userId },
    });
    if (!existing) throw new Error("Ficha não encontrada");

    await prisma.$transaction([
      prisma.templateExercise.deleteMany({ where: { templateId } }),
      prisma.workoutTemplate.update({
        where: { id: templateId },
        data: payload,
      }),
      ...data.items.map((item, index) =>
        prisma.templateExercise.create({
          data: {
            templateId,
            exerciseId: item.exerciseId,
            order: index,
            sets: item.sets,
            reps: item.reps,
            restSeconds: item.restSeconds,
            rpe: item.rpe ?? null,
            tempo: item.tempo ?? null,
            notes: item.notes ?? null,
            supersetGroup: item.supersetGroup ?? null,
          },
        }),
      ),
    ]);
  } else {
    await prisma.workoutTemplate.create({
      data: {
        ...payload,
        userId,
        items: {
          create: data.items.map((item, index) => ({
            exerciseId: item.exerciseId,
            order: index,
            sets: item.sets,
            reps: item.reps,
            restSeconds: item.restSeconds,
            rpe: item.rpe ?? null,
            tempo: item.tempo ?? null,
            notes: item.notes ?? null,
            supersetGroup: item.supersetGroup ?? null,
          })),
        },
      },
    });
  }

  revalidatePath("/treinos");
  return { ok: true };
}

export async function deleteTemplate(templateId: string) {
  const userId = await requireUserId();
  const template = await prisma.workoutTemplate.findFirst({
    where: { id: templateId, userId },
  });
  if (!template) throw new Error("Ficha não encontrada");
  await prisma.workoutTemplate.delete({ where: { id: templateId } });
  revalidatePath("/treinos");
  return { ok: true };
}

/* ───────────────────────────── Sessões ───────────────────────────── */

/**
 * Converte a prescrição textual de repetições ("8-12", "12", "30s", "10 por lado")
 * em um número de reps aplicável ao registro da série.
 */
function parseReps(reps: string): number | null {
  if (/s\b|seg|segundo|isom/i.test(reps)) return null;
  const match = reps.match(/(\d+)/);
  if (!match) return null;
  return Number(match[1]);
}

export async function startSession(templateId: string) {
  const userId = await requireUserId();
  const template = await prisma.workoutTemplate.findFirst({
    where: { id: templateId, OR: [{ userId }, { isSystem: true }] },
    include: { items: { include: { exercise: true }, orderBy: { order: "asc" } } },
  });
  if (!template) throw new Error("Ficha não encontrada");

  const session = await prisma.workoutSession.create({
    data: {
      userId,
      templateId: template.id,
      name: template.name,
      status: "in_progress",
      items: {
        create: template.items.map((item, index) => ({
          exerciseId: item.exerciseId,
          order: index,
          notes: item.notes,
          sets: {
            create: Array.from({ length: item.sets }, (_, setIndex) => ({
              order: setIndex,
              weightKg: null,
              reps: parseReps(item.reps),
              rpe: item.rpe ?? null,
              completed: false,
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/treinos");
  return { ok: true, sessionId: session.id };
}

export async function updateSet(
  setId: string,
  patch: { weightKg?: number | null; reps?: number | null; rpe?: number | null; completed?: boolean },
) {
  const userId = await requireUserId();
  const set = await prisma.setLog.findFirst({
    where: { id: setId, workoutExercise: { session: { userId } } },
    include: { workoutExercise: { include: { exercise: true } } },
  });
  if (!set) throw new Error("Série não encontrada");

  const updated = await prisma.setLog.update({
    where: { id: setId },
    data: {
      ...(patch.weightKg !== undefined ? { weightKg: patch.weightKg } : {}),
      ...(patch.reps !== undefined ? { reps: patch.reps } : {}),
      ...(patch.rpe !== undefined ? { rpe: patch.rpe } : {}),
      ...(patch.completed !== undefined ? { completed: patch.completed } : {}),
    },
  });

  // Marca PR quando a estimativa de 1RM supera o melhor set anterior do exercício.
  let isPr = false;
  if (patch.completed && updated.weightKg && updated.reps) {
    const { calculateOneRepMax } = await import("@/lib/domain/calculators");
    const current = calculateOneRepMax(updated.weightKg, updated.reps).value;
    const previous = await prisma.setLog.findMany({
      where: {
        workoutExercise: { exerciseId: set.workoutExercise.exerciseId, session: { userId } },
        completed: true,
        id: { not: setId },
        weightKg: { not: null },
        reps: { not: null },
      },
    });
    const bestPrevious = Math.max(
      0,
      ...previous.map((p) =>
        calculateOneRepMax(p.weightKg as number, p.reps as number).value,
      ),
    );
    isPr = current > bestPrevious && bestPrevious > 0;
    if (isPr) {
      await prisma.setLog.update({ where: { id: setId }, data: { isPr: true } });
    }
  }

  revalidatePath("/treinos");
  revalidatePath("/progresso");
  return { ok: true, isPr };
}

export async function completeSession(sessionId: string, notes?: string) {
  const userId = await requireUserId();
  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session) throw new Error("Sessão não encontrada");

  const completedAt = new Date();
  const durationSeconds = Math.max(
    0,
    Math.round((completedAt.getTime() - session.startedAt.getTime()) / 1000),
  );

  await prisma.workoutSession.update({
    where: { id: sessionId },
    data: {
      completedAt,
      durationSeconds,
      notes: notes ?? session.notes,
      status: "completed",
    },
  });

  // Desbloqueia conquistas que o novo treino pode ter desbloqueado.
  const unlockedSlugs = await syncAchievements(userId);
  const unlocked =
    unlockedSlugs.length > 0
      ? await prisma.achievement.findMany({
          where: { slug: { in: unlockedSlugs } },
          select: { slug: true, title: true, icon: true, xp: true },
        })
      : [];

  revalidatePath("/treinos");
  revalidatePath("/progresso");
  revalidatePath("/");
  return { ok: true, durationSeconds, unlocked };
}

export async function abandonSession(sessionId: string) {
  const userId = await requireUserId();
  await prisma.workoutSession.updateMany({
    where: { id: sessionId, userId },
    data: { status: "abandoned" },
  });
  revalidatePath("/treinos");
  return { ok: true };
}

export async function updateSessionNotes(sessionId: string, notes: string) {
  const userId = await requireUserId();
  await prisma.workoutSession.updateMany({
    where: { id: sessionId, userId },
    data: { notes },
  });
  revalidatePath("/treinos");
  return { ok: true };
}

/* ───────────────────────────── Favoritos ───────────────────────────── */

export async function toggleFavorite(exerciseId: string) {
  const userId = await requireUserId();
  const existing = await prisma.favorite.findUnique({
    where: { userId_exerciseId: { userId, exerciseId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({ data: { userId, exerciseId } });
  }

  revalidatePath("/exercicios");
  return { ok: true, favorite: !existing };
}

/* ───────────────────────────── Plano gerado ───────────────────────────── */

export async function saveGeneratedPlan(input: {
  name: string;
  description: string;
  split: string;
  daysPerWeek: number;
  estMinutes: number;
  rationale: string;
  items: {
    exerciseId: string;
    sets: number;
    reps: string;
    restSeconds: number;
    rpe?: number | null;
    tempo?: string | null;
    notes?: string | null;
    supersetGroup?: string | null;
  }[];
}) {
  const userId = await requireUserId();
  const name = `${input.name} — ${slugify(new Date().toISOString().slice(0, 10))}`;

  await prisma.workoutTemplate.create({
    data: {
      userId,
      name,
      description: input.description,
      split: input.split,
      goal: null,
      level: null,
      equipment: toJsonArray([]),
      daysPerWeek: input.daysPerWeek,
      estMinutes: input.estMinutes,
      tags: toJsonArray(["gerado", input.split]),
      items: {
        create: input.items.map((item, index) => ({
          exerciseId: item.exerciseId,
          order: index,
          sets: item.sets,
          reps: item.reps,
          restSeconds: item.restSeconds,
          rpe: item.rpe ?? null,
          tempo: item.tempo ?? null,
          notes: item.notes ?? null,
          supersetGroup: item.supersetGroup ?? null,
        })),
      },
    },
  });

  revalidatePath("/treinos");
  return { ok: true };
}
