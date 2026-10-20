"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireUserId } from "@/server/auth-helpers";
import {
  CARDIO_ACTIVITIES,
  CARDIO_INTENSITIES,
} from "@/lib/domain/cardio";

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error("Data inválida");
  }
  return date;
}

const cardioSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha uma data válida"),
  activity: z.enum(CARDIO_ACTIVITIES),
  durationMinutes: z.coerce.number().int().min(5).max(300),
  intensity: z.enum(CARDIO_INTENSITIES),
  distanceKm: z.coerce.number().min(0).max(500).optional().nullable(),
  notes: z.string().trim().max(400).optional().nullable(),
  completed: z.boolean().default(false),
});

export type CardioInput = z.infer<typeof cardioSchema>;

function revalidateCardioPaths() {
  revalidatePath("/cardio");
  revalidatePath("/painel");
  revalidatePath("/treinos");
  revalidatePath("/progresso");
}

/** Agenda um cardio ao ar livre — inclusive em um dia sem treino de força. */
export async function addCardio(input: CardioInput) {
  const userId = await requireUserId();
  const data = cardioSchema.parse(input);
  const date = parseLocalDate(data.date);
  const completed = data.completed;

  const entry = await prisma.cardioSession.create({
    data: {
      userId,
      date,
      activity: data.activity,
      durationMinutes: data.durationMinutes,
      intensity: data.intensity,
      distanceKm:
        data.distanceKm && data.distanceKm > 0 ? data.distanceKm : null,
      notes: data.notes?.trim() || null,
      status: completed ? "completed" : "planned",
      completedAt: completed ? new Date() : null,
    },
  });

  revalidateCardioPaths();
  return { ok: true, id: entry.id };
}

/** Conclui um cardio planejado sem apagar o registro original. */
export async function completeCardio(cardioId: string) {
  const userId = await requireUserId();
  const entry = await prisma.cardioSession.findFirst({
    where: { id: cardioId, userId },
  });
  if (!entry) throw new Error("Cardio não encontrado");
  if (entry.status === "completed") return { ok: true };

  await prisma.cardioSession.update({
    where: { id: entry.id },
    data: {
      status: "completed",
      completedAt: new Date(),
    },
  });

  revalidateCardioPaths();
  return { ok: true };
}
