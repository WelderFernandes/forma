import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const targetId = "cmvg28fg10016v82ct3ur8ejj";
  const s = await prisma.workoutSession.findUnique({
    where: { id: targetId },
    include: {
      items: { include: { exercise: { select: { name: true } }, sets: true } },
      user: { select: { email: true } },
    },
  });
  if (!s) {
    console.log("Sessão não encontrada:", targetId);
    return;
  }
  console.log("status:", s.status, "| usuário:", s.user.email);
  const done = s.items.reduce((a, i) => a + i.sets.filter((x) => x.completed).length, 0);
  const total = s.items.reduce((a, i) => a + i.sets.length, 0);
  console.log(`séries: ${done}/${total}`);
  for (const i of s.items.slice(0, 4)) {
    for (const set of i.sets.slice(0, 4)) {
      if (set.completed || set.weightKg !== null) {
        console.log(`  ${i.exercise.name} s${set.order + 1}: ${set.weightKg ?? "—"} kg × ${set.reps ?? "—"} · RPE ${set.rpe ?? "—"} · ${set.completed ? "concluída" : "pendente"}${set.isPr ? " · PR" : ""}`);
      }
    }
  }

  const uas = await prisma.userAchievement.findMany({
    where: { userId: s.userId },
    include: { achievement: { select: { slug: true, title: true, icon: true, xp: true } } },
    orderBy: { unlockedAt: "desc" },
  });
  console.log(`\nconquistas do usuário (${uas.length}):`);
  for (const ua of uas) {
    console.log(`  ${ua.unlockedAt.toISOString().slice(0,19)}  ${ua.achievement.slug}  "${ua.achievement.title}"  (${ua.achievement.xp} XP)`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
