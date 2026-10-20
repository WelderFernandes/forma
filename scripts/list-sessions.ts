/** Lista as sessões de treino e seus estados (diagnóstico). */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.workoutSession.findMany({
    orderBy: { startedAt: "desc" },
    include: {
      user: { select: { email: true } },
      items: { include: { exercise: { select: { name: true } }, sets: true } },
    },
  });

  console.log(`Sessões: ${sessions.length}\n`);
  for (const s of sessions) {
    const done = s.items.reduce(
      (a, i) => a + i.sets.filter((x) => x.completed).length,
      0,
    );
    const total = s.items.reduce((a, i) => a + i.sets.length, 0);
    console.log(
      `${s.id}  ${s.status.padEnd(12)} ${String(done).padStart(2)}/${total} séries  ${s.user.email}  ${s.startedAt.toISOString()}`,
    );
    const filled = s.items
      .flatMap((i) => i.sets)
      .filter((x) => x.weightKg !== null || x.reps !== null || x.completed);
    for (const set of filled.slice(0, 6)) {
      console.log(
        `     série ${set.order + 1}: ${set.weightKg ?? "—"} kg × ${set.reps ?? "—"} reps · RPE ${set.rpe ?? "—"} · ${set.completed ? "concluída" : "pendente"}`,
      );
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
