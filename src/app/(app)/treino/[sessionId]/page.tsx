import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { WorkoutSession, type SessionItem } from "@/components/workout-session";
import { getCurrentUser } from "@/server/auth-helpers";

export const metadata: Metadata = {
  title: "Treino em andamento",
};

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId: user.id },
    include: {
      template: { select: { id: true, items: { select: { restSeconds: true } } } },
      items: {
        include: {
          exercise: true,
          sets: { orderBy: { order: "asc" } },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!session) notFound();

  const items: SessionItem[] = session.items.map((item) => ({
    id: item.id,
    order: item.order,
    notes: item.notes,
    exercise: {
      id: item.exerciseId,
      slug: item.exercise.slug,
      name: item.exercise.name,
      primaryMuscle: item.exercise.primaryMuscle,
      equipment: item.exercise.equipment,
      instructions: safeJson<string>(item.exercise.instructions),
      tips: safeJson<string>(item.exercise.tips),
      commonMistakes: safeJson<string>(item.exercise.commonMistakes),
      breathing: item.exercise.breathing,
    },
    sets: item.sets.map((set) => ({
      id: set.id,
      order: set.order,
      weightKg: set.weightKg,
      reps: set.reps,
      rpe: set.rpe,
      completed: set.completed,
      isPr: set.isPr,
    })),
  }));

  const defaultRest = session.template?.items[0]?.restSeconds ?? 60;

  return (
    <WorkoutSession
      sessionId={session.id}
      name={session.name}
      startedAt={session.startedAt.toISOString()}
      items={items}
      defaultRestSeconds={defaultRest}
    />
  );
}

function safeJson<T>(raw: string): T[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}