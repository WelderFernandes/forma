/** Confere se os dados do último treino foram gravados no banco. */
import { prisma } from "../src/lib/prisma";

async function main() {
  const session = await prisma.workoutSession.findFirst({
    orderBy: { startedAt: "desc" },
    include: {
      items: {
        include: {
          exercise: { select: { name: true, primaryMuscle: true } },
          sets: { orderBy: { order: "asc" } },
        },
      },
      user: { select: { email: true } },
    },
  });

  if (!session) {
    console.log("Nenhuma sessão encontrada.");
    return;
  }

  console.log(`Usuário:      ${session.user.email}`);
  console.log(`Sessão:       ${session.name} (${session.status})`);
  console.log(`Exercícios:   ${session.items.length}`);
  console.log(`Séries totais:${session.items.reduce((a, i) => a + i.sets.length, 0)}`);

  const first = session.items[0];
  if (first) {
    console.log(`\nPrimeiro exercício: ${first.exercise.name}`);
    for (const set of first.sets) {
      console.log(
        `  série ${set.order + 1}: ${set.weightKg ?? "—"} kg × ${set.reps ?? "—"} reps · RPE ${set.rpe ?? "—"} · ${set.completed ? "concluída" : "pendente"}${set.isPr ? " · PR!" : ""}`,
      );
    }
  }

  const prs = await prisma.setLog.count({ where: { isPr: true } });
  const achievements = await prisma.userAchievement.count();
  console.log(`\nPRs no banco:  ${prs}`);
  console.log(`Conquistas:    ${achievements}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
