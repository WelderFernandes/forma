"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireUserId } from "@/server/auth-helpers";

export async function startChallenge(challengeId: string) {
  const userId = await requireUserId();
  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
  if (!challenge) throw new Error("Desafio não encontrado");

  const existing = await prisma.userChallenge.findUnique({
    where: { userId_challengeId: { userId, challengeId } },
  });
  if (existing) throw new Error("Você já iniciou este desafio");

  await prisma.userChallenge.create({
    data: { userId, challengeId, currentDay: 1, startedAt: new Date() },
  });

  revalidatePath("/desafios");
  return { ok: true };
}

export async function advanceChallenge(challengeId: string) {
  const userId = await requireUserId();
  const progress = await prisma.userChallenge.findUnique({
    where: { userId_challengeId: { userId, challengeId } },
    include: { challenge: true },
  });
  if (!progress) throw new Error("Desafio não iniciado");

  const currentDay = Math.min(progress.challenge.days, progress.currentDay + 1);
  await prisma.userChallenge.update({
    where: { id: progress.id },
    data: {
      currentDay,
      streak: progress.streak + 1,
      completedAt:
        currentDay >= progress.challenge.days ? new Date() : null,
    },
  });

  revalidatePath("/desafios");
  return { ok: true, currentDay };
}

export async function completeChallenge(challengeId: string) {
  const userId = await requireUserId();
  await prisma.userChallenge.updateMany({
    where: { userId, challengeId },
    data: { completedAt: new Date(), currentDay: 999 },
  });
  revalidatePath("/desafios");
  return { ok: true };
}

export async function markTipRead(tipId: string) {
  const userId = await requireUserId();
  await prisma.tipRead.upsert({
    where: { userId_tipId: { userId, tipId } },
    create: { userId, tipId },
    update: { readAt: new Date() },
  });
  revalidatePath("/mentalidade");
  return { ok: true };
}
