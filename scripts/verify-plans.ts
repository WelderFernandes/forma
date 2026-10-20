/**
 * Verifica se o gerador de plano resolve TODOS os slots em todas as
 * combinações de objetivo, nível, equipamento e rotina.
 *
 * Falha (exit 1) se algum slot ficar sem exercício correspondente.
 *
 * Uso: pnpm exec tsx scripts/verify-plans.ts
 */
import { PrismaClient } from "@prisma/client";
import { generatePlan } from "../src/lib/domain/plan-generator";
import { resolvePlanSlots } from "../src/server/plan";
import type { Equipment, Level } from "../src/lib/domain/types";

const prisma = new PrismaClient();

const GOALS = [
  "lose_weight",
  "build_muscle",
  "recompose",
  "mobility",
  "endurance",
  "general_health",
];

const LEVELS: Level[] = ["beginner", "intermediate", "advanced"];

const EQUIPMENT_SETS: Equipment[][] = [
  ["none", "mat"],
  ["none", "mat", "dumbbell"],
  ["none", "mat", "dumbbell", "band", "bench"],
  ["none", "mat", "dumbbell", "barbell", "cable", "machine", "bench", "band"],
];

const DAYS = [2, 3, 4, 5, 6];
const MINUTES = [20, 35, 45, 60];

async function main() {
  let total = 0;
  let failures = 0;
  const unresolved = new Map<string, number>();

  for (const goal of GOALS) {
    for (const level of LEVELS) {
      for (const equipment of EQUIPMENT_SETS) {
        for (const days of DAYS) {
          for (const minutes of MINUTES) {
            total += 1;
            const plan = generatePlan({
              goal,
              level,
              equipment,
              daysPerWeek: days,
              sessionMinutes: minutes,
              focusAreas: [],
              lowImpact: false,
            });

            const resolved = await resolvePlanSlots(plan.slots, { level, equipment });
            for (const { slot, exercise } of resolved) {
              if (!exercise) {
                failures += 1;
                const key = `${slot.key} (${slot.muscle})`;
                unresolved.set(key, (unresolved.get(key) ?? 0) + 1);
              }
            }
          }
        }
      }
    }
  }

  // Inventário de músculos primários realmente disponíveis no catálogo
  const rows = await prisma.exercise.findMany({ select: { primaryMuscle: true } });
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.primaryMuscle, (counts.get(row.primaryMuscle) ?? 0) + 1);
  }

  console.log(`\nCatálogo: ${rows.length} exercícios`);
  console.log(
    "Músculos primários:",
    [...counts.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `${k}(${v})`)
      .join(", "),
  );

  console.log(`\nCombinações testadas: ${total}`);
  console.log(`Slots sem exercício: ${failures}`);

  if (failures > 0) {
    console.log("\nSlots problemáticos:");
    for (const [key, count] of [...unresolved.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(` - ${key}: ${count}x`);
    }
    process.exitCode = 1;
  } else {
    console.log("\n✔ Todos os slots resolvem em todas as combinações.");
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
