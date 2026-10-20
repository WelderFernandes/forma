import prisma from "@/lib/prisma";
import type { PlanSlot } from "@/lib/domain/plan-generator";
import type { Equipment } from "@/lib/domain/types";
import { parseJsonArray } from "@/lib/domain/types";

type ExerciseRow = {
  id: string;
  slug: string;
  name: string;
  primaryMuscle: string;
  equipment: string;
  category: string;
  difficulty: string;
  impact: string;
  instructions: string[];
  tips: string[];
  commonMistakes: string[];
};

/**
 * Resolve os slots gerados pelo plan-generator contra o catálogo real.
 *
 * Pontuação: equipamento compatível > musculo primário exato > baixo impacto
 * (quando pedido) > dificuldade compatível com o nível do usuário.
 */
export async function resolvePlanSlots(
  slots: PlanSlot[],
  options: { level?: string | null; equipment?: string[] },
): Promise<{ slot: PlanSlot; exercise: ExerciseRow | null }[]> {
  const rows = await prisma.exercise.findMany();
  const catalogue = rows.map((row) => ({
    ...row,
    instructions: parseJsonArray(row.instructions),
    tips: parseJsonArray(row.tips),
    commonMistakes: parseJsonArray(row.commonMistakes),
  }));

  const used = new Set<string>();
  const level = options.level ?? "beginner";
  const available = new Set<string>(options.equipment ?? []);

  const resolved = slots.map((slot) => {
    // Preferência: exercício cujo músculo primário é o alvo.
    // Fallback: exercício que usa o alvo como músculo secundário.
    const primaries = catalogue.filter((ex) => ex.primaryMuscle === slot.muscle);
    const secondaries = catalogue.filter(
      (ex) =>
        ex.primaryMuscle !== slot.muscle &&
        parseJsonArray(ex.secondaryMuscles).includes(slot.muscle),
    );
    const pool = primaries.length > 0 ? primaries : secondaries;

    const candidates = pool
      .map((ex) => {
        let score = 0;

        // Equipamento ideal
        const preferredIndex = slot.equipmentPreference.indexOf(
          ex.equipment as Equipment,
        );
        if (preferredIndex >= 0) score += 100 - preferredIndex * 10;
        else if (ex.equipment === "none") score += 40;
        else if (!available.size || available.has(ex.equipment)) score += 10;
        else score -= 30;

        // Baixo impacto
        if (slot.preferLowImpact) {
          if (ex.impact === "low") score += 35;
          else if (ex.impact === "moderate") score += 10;
          else score -= 25;
        }

        // Dificuldade compatível com o nível
        if (level === "beginner") {
          if (ex.difficulty === "beginner") score += 25;
          else if (ex.difficulty === "intermediate") score += 8;
          else score -= 20;
        } else if (level === "advanced") {
          if (ex.difficulty === "advanced") score += 20;
          else if (ex.difficulty === "intermediate") score += 12;
          else score += 2;
        } else {
          if (ex.difficulty === "intermediate") score += 20;
          else if (ex.difficulty === "beginner") score += 15;
          else score += 8;
        }

        // Evita repetir o mesmo exercício em slots diferentes
        if (used.has(ex.id)) score -= 45;

        return { ex, score };
      })
      .sort((a, b) => b.score - a.score);

    // Fallback: qualquer exercício do mesmo grupo muscular
    const chosen = candidates[0]?.ex ?? null;
    if (chosen) used.add(chosen.id);

    return { slot, exercise: chosen };
  });

  return resolved;
}
