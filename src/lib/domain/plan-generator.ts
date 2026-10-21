/**
 * Gerador de plano de treino.
 *
 * Reproduz o funil do BetterMe (quiz → plano sob medida) em versão web:
 * a partir de objetivo, nível, equipamento, dias por semana e duração,
 * devolvemos uma "ficha" pronta com slots de exercício, séries, reps e descanso.
 *
 * O gerador produz *slots* (descrições), e a camada de servidor resolve cada
 * slot contra o catálogo real de exercícios (ver resolveSlots).
 */

import type { Equipment, Level } from "./types";

export type PlanInput = {
  goal: string | null | undefined;
  level: Level | null | undefined;
  equipment: Equipment[];
  daysPerWeek: number;
  sessionMinutes: number;
  focusAreas: string[];
  lowImpact: boolean;
};

export type PlanSlot = {
  key: string;
  label: string;
  muscle: string;
  equipmentPreference: Equipment[];
  sets: number;
  reps: string;
  restSeconds: number;
  rpe?: number;
  tempo?: string;
  supersetGroup?: string;
  note?: string;
  /** Exercícios isométricos/estáticos são mais seguros para baixo impacto. */
  preferLowImpact: boolean;
};

export type GeneratedPlan = {
  name: string;
  description: string;
  split: string;
  daysPerWeek: number;
  estMinutes: number;
  slots: PlanSlot[];
  rationale: string;
};

// ───────────────────────────── Helpers de prescrição ─────────────────────────────

function setsFor(goal: string | null | undefined, level: Level | null | undefined) {
  const base = goal === "build_muscle" ? 4 : goal === "endurance" ? 2 : 3;
  const bonus = level === "advanced" ? 1 : level === "beginner" ? -1 : 0;
  return Math.max(1, base + bonus);
}

function repsFor(goal: string | null | undefined, muscle: string): string {
  if (goal === "build_muscle") return muscle === "core" ? "12-15" : "6-10";
  if (goal === "endurance") return "15-20";
  if (goal === "mobility") return "10-15";
  if (goal === "lose_weight") return "12-15";
  return "8-12";
}

function restFor(goal: string | null | undefined, muscle: string): number {
  const compound = ["peito", "costas", "quadril", "posterior_coxa", "coxa"].includes(muscle);
  if (goal === "endurance") return 45;
  if (goal === "build_muscle") return compound ? 120 : 75;
  if (goal === "mobility") return 45;
  return compound ? 90 : 60;
}

function rpeFor(level: Level | null | undefined): number {
  if (level === "beginner") return 6;
  if (level === "advanced") return 8;
  return 7;
}

// ───────────────────────────── Blocos por split ─────────────────────────────

type Block = {
  key: string;
  label: string;
  slots: PlanSlot[];
};

function slot(
  key: string,
  label: string,
  muscle: string,
  opts: Partial<PlanSlot> = {},
): PlanSlot {
  return {
    key,
    label,
    muscle,
    equipmentPreference: ["none"],
    sets: 3,
    reps: "10",
    restSeconds: 60,
    preferLowImpact: false,
    ...opts,
  };
}

function buildFullBody(input: PlanInput): PlanSlot[] {
  const s = setsFor(input.goal, input.level);
  const r = rpeFor(input.level);
  const compound: Equipment[] =
    input.equipment.includes("barbell") && !input.lowImpact
      ? ["barbell", "dumbbell", "machine", "none"]
      : input.equipment.includes("dumbbell")
        ? ["dumbbell", "band", "machine", "none"]
        : input.equipment.includes("kettlebell")
          ? ["kettlebell", "dumbbell", "band", "none"]
          : ["band", "none"];

  const push: Equipment[] = input.equipment.includes("dumbbell")
    ? ["dumbbell", "band", "machine", "none"]
    : ["band", "none"];

  return [
    slot("compound-1", "Movimento composto principal", "coxa", {
      equipmentPreference: compound,
      sets: s,
      reps: repsFor(input.goal, "coxa"),
      restSeconds: restFor(input.goal, "coxa"),
      rpe: r,
      tempo: "3-1-1",
    }),
    slot("push-1", "Empurrar", "peito", {
      equipmentPreference: push,
      sets: s,
      reps: repsFor(input.goal, "peito"),
      restSeconds: restFor(input.goal, "peito"),
      rpe: r,
      tempo: "2-0-2",
    }),
    slot("pull-1", "Puxar", "costas", {
      equipmentPreference: input.equipment.includes("barbell")
        ? ["barbell", "cable", "dumbbell", "band", "none"]
        : input.equipment.includes("dumbbell")
          ? ["dumbbell", "band", "cable", "none"]
          : ["band", "none"],
      sets: s,
      reps: repsFor(input.goal, "costas"),
      restSeconds: restFor(input.goal, "costas"),
      rpe: r,
      tempo: "2-1-2",
    }),
    slot("legs-1", "Posterior de coxa", "posterior_coxa", {
      equipmentPreference: compound,
      sets: s,
      reps: repsFor(input.goal, "posterior_coxa"),
      restSeconds: restFor(input.goal, "posterior_coxa"),
      rpe: r,
    }),
    slot("core-1", "Core", "core", {
      sets: 3,
      reps: "12-20",
      restSeconds: 45,
      rpe: r - 1,
      preferLowImpact: input.lowImpact,
    }),
    slot("carry-1", "Estabilização / carry", "core", {
      sets: 3,
      reps: "30s",
      restSeconds: 45,
      rpe: r,
      preferLowImpact: input.lowImpact,
      note: "Progressão de carga simples, ótimo para joelho e lombar.",
    }),
  ];
}

function buildUpperLower(input: PlanInput): PlanSlot[][] {
  const s = setsFor(input.goal, input.level);
  const r = rpeFor(input.level);
  const pushEquip: Equipment[] = input.equipment.includes("dumbbell")
    ? ["dumbbell", "machine", "band", "none"]
    : ["band", "none"];
  const pullEquip: Equipment[] = input.equipment.includes("barbell")
    ? ["barbell", "cable", "dumbbell", "band", "none"]
    : ["band", "none"];
  const legEquip: Equipment[] = input.equipment.includes("barbell")
    ? ["barbell", "dumbbell", "machine", "kettlebell", "none"]
    : ["band", "none"];

  const upper: PlanSlot[] = [
    slot("u-push-1", "Empurrar — composto", "peito", {
      equipmentPreference: pushEquip,
      sets: s,
      reps: repsFor(input.goal, "peito"),
      restSeconds: restFor(input.goal, "peito"),
      rpe: r,
      tempo: "2-0-2",
    }),
    slot("u-pull-1", "Puxar — composto", "costas", {
      equipmentPreference: pullEquip,
      sets: s,
      reps: repsFor(input.goal, "costas"),
      restSeconds: restFor(input.goal, "costas"),
      rpe: r,
      tempo: "2-1-2",
    }),
    slot("u-press", "Ombros", "ombro", {
      equipmentPreference: pushEquip,
      sets: 3,
      reps: "8-12",
      restSeconds: 75,
      rpe: r,
    }),
    slot("u-superset", "Supersérie arms", "biceps", {
      equipmentPreference: ["dumbbell", "band", "none"],
      sets: 3,
      reps: "10-12",
      restSeconds: 60,
      rpe: r,
      supersetGroup: "arms",
      note: "Bíceps e tríceps alternados para escalar a densidade.",
    }),
    slot("u-superset-2", "Supersérie arms", "triceps", {
      equipmentPreference: ["dumbbell", "band", "none"],
      sets: 3,
      reps: "10-12",
      restSeconds: 60,
      rpe: r,
      supersetGroup: "arms",
    }),
    slot("u-core", "Core", "core", {
      sets: 3,
      reps: "12-15",
      restSeconds: 45,
      rpe: r - 1,
      preferLowImpact: input.lowImpact,
    }),
  ];

  const lower: PlanSlot[] = [
    slot("l-squat", "Agachamento — composto", "coxa", {
      equipmentPreference: legEquip,
      sets: s,
      reps: repsFor(input.goal, "coxa"),
      restSeconds: restFor(input.goal, "coxa"),
      rpe: r,
      tempo: "3-1-1",
    }),
    slot("l-hinge", "Hip thrust / flexão de quadril", "gluteos", {
      equipmentPreference: input.equipment.includes("band")
        ? ["band", "dumbbell", "none"]
        : ["dumbbell", "none"],
      sets: s,
      reps: repsFor(input.goal, "gluteos"),
      restSeconds: restFor(input.goal, "gluteos"),
      rpe: r,
      tempo: "2-1-2",
    }),
    slot("l-lunge", "Afundo", "posterior_coxa", {
      equipmentPreference: legEquip,
      sets: 3,
      reps: "10-12 por lado",
      restSeconds: 75,
      rpe: r,
      preferLowImpact: input.lowImpact,
    }),
    slot("l-calf", "Panturrilha", "panturrilha", {
      equipmentPreference: ["none", "dumbbell", "step"],
      sets: 3,
      reps: "15-20",
      restSeconds: 45,
      rpe: r,
    }),
    slot("l-core", "Core anti-extensão", "core", {
      sets: 3,
      reps: "12-15",
      restSeconds: 45,
      rpe: r - 1,
      preferLowImpact: input.lowImpact,
    }),
  ];

  return [upper, lower];
}

function buildPpl(input: PlanInput): PlanSlot[][] {
  const s = setsFor(input.goal, input.level);
  const r = rpeFor(input.level);
  const pushEquip: Equipment[] = input.equipment.includes("dumbbell")
    ? ["dumbbell", "machine", "band", "none"]
    : ["band", "none"];
  const pullEquip: Equipment[] = input.equipment.includes("barbell")
    ? ["barbell", "cable", "dumbbell", "band", "none"]
    : ["band", "none"];
  const legEquip: Equipment[] = input.equipment.includes("barbell")
    ? ["barbell", "dumbbell", "kettlebell", "none"]
    : ["band", "none"];

  return [
    [
      slot("p-chest", "Peito", "peito", {
        equipmentPreference: pushEquip,
        sets: s,
        reps: repsFor(input.goal, "peito"),
        restSeconds: restFor(input.goal, "peito"),
        rpe: r,
      }),
      slot("p-shoulder", "Ombro", "ombro", {
        equipmentPreference: pushEquip,
        sets: 3,
        reps: "8-12",
        restSeconds: 75,
        rpe: r,
      }),
      slot("p-triceps", "Tríceps", "triceps", {
        equipmentPreference: ["dumbbell", "band", "none"],
        sets: 3,
        reps: "10-12",
        restSeconds: 60,
        rpe: r,
        supersetGroup: "push-accessory",
      }),
      slot("p-accessory", "Supersérie tríceps", "triceps", {
        equipmentPreference: ["none", "dumbbell", "band"],
        sets: 3,
        reps: "12-15",
        restSeconds: 60,
        rpe: r - 1,
        supersetGroup: "push-accessory",
      }),
      slot("p-core", "Core", "core", {
        sets: 3,
        reps: "15",
        restSeconds: 40,
        rpe: r - 1,
      }),
    ],
    [
      slot("q-back", "Costas", "costas", {
        equipmentPreference: pullEquip,
        sets: s,
        reps: repsFor(input.goal, "costas"),
        restSeconds: restFor(input.goal, "costas"),
        rpe: r,
      }),
      slot("q-biceps", "Bíceps", "biceps", {
        equipmentPreference: ["dumbbell", "band", "none"],
        sets: 3,
        reps: "10-12",
        restSeconds: 60,
        rpe: r,
        supersetGroup: "pull-accessory",
      }),
      slot("q-accessory", "Supersérie costas", "costas", {
        equipmentPreference: ["band", "dumbbell", "none"],
        sets: 3,
        reps: "12-15",
        restSeconds: 60,
        rpe: r - 1,
        supersetGroup: "pull-accessory",
      }),
      slot("q-forearm", "Antebraço / pegada", "antebraco", {
        sets: 3,
        reps: "12-15",
        restSeconds: 45,
        rpe: r,
      }),
    ],
    [
      slot("l-squat", "Agachamento", "coxa", {
        equipmentPreference: legEquip,
        sets: s,
        reps: repsFor(input.goal, "coxa"),
        restSeconds: restFor(input.goal, "coxa"),
        rpe: r,
        tempo: "3-1-1",
      }),
      slot("l-rdl", "Terra romeno", "posterior_coxa", {
        equipmentPreference: legEquip,
        sets: 3,
        reps: "10-12",
        restSeconds: 90,
        rpe: r,
        tempo: "3-1-1",
      }),
      slot("l-lunge", "Afundo", "coxa", {
        equipmentPreference: ["dumbbell", "none", "step"],
        sets: 3,
        reps: "10 por lado",
        restSeconds: 75,
        rpe: r,
        preferLowImpact: input.lowImpact,
      }),
      slot("l-calf", "Panturrilha", "panturrilha", {
        equipmentPreference: ["none", "step", "dumbbell"],
        sets: 4,
        reps: "12-20",
        restSeconds: 45,
        rpe: r,
      }),
      slot("l-core", "Core", "core", {
        sets: 3,
        reps: "15",
        restSeconds: 40,
        rpe: r - 1,
      }),
    ],
  ];
}

function buildCardio(input: PlanInput): PlanSlot[] {
  const minutes = input.sessionMinutes;
  return [
    slot("cardio-warmup", "Aquecimento", "cardio", {
      sets: 1,
      reps: `${Math.max(5, Math.round(minutes * 0.12))} min`,
      restSeconds: 20,
      rpe: 4,
    }),
    slot("cardio-main", "Bloco principal", "cardio", {
      sets: 4,
      reps: "40s trabalho / 20s descanso",
      restSeconds: 30,
      rpe: 7,
      note: "Escalonamento: a cada bloco, aumente 10s o trabalho e encurte 5s o descanso.",
    }),
    slot("cardio-cooldown", "Volta à calma", "cardio", {
      sets: 1,
      reps: `${Math.max(5, Math.round(minutes * 0.1))} min`,
      restSeconds: 0,
      rpe: 3,
    }),
  ];
}

function buildMobility(): PlanSlot[] {
  return [
    slot("mob-hips", "Mobilidade de quadril", "gluteos", {
      sets: 2,
      reps: "45s por lado",
      restSeconds: 30,
      rpe: 4,
      preferLowImpact: true,
    }),
    slot("mob-spine", "Mobilidade de coluna", "lombar", {
      sets: 2,
      reps: "10 reps",
      restSeconds: 30,
      rpe: 4,
      preferLowImpact: true,
    }),
    slot("mob-shoulder", "Mobilidade de ombro", "ombro", {
      sets: 2,
      reps: "12 reps",
      restSeconds: 30,
      rpe: 4,
      preferLowImpact: true,
    }),
    slot("mob-ankle", "Mobilidade de tornozelo", "panturrilha", {
      sets: 2,
      reps: "15 reps por lado",
      restSeconds: 30,
      rpe: 4,
      preferLowImpact: true,
    }),
    slot("mob-breath", "Respiração diafragmática", "core", {
      sets: 3,
      reps: "5 respirações",
      restSeconds: 20,
      rpe: 3,
      preferLowImpact: true,
      note: "4 segundos inspira, 6-8 segundos expira. Reduz ansiedade e melhora o controle motor.",
    }),
  ];
}

// ───────────────────────────── Entrada principal ─────────────────────────────

export function generatePlan(input: PlanInput): GeneratedPlan {
  const days = Math.max(2, Math.min(6, input.daysPerWeek || 3));
  const goal = input.goal;

  let blocks: Block[] = [];
  let split = "full_body";
  let name = "";
  let description = "";
  let rationale = "";

  if (goal === "mobility" || input.focusAreas.includes("mobilidade")) {
    split = "mobility";
    blocks = [
      { key: "mob", label: "Mobilidade & Controle", slots: buildMobility() },
    ];
    name = "Plano de Mobilidade";
    description =
      "Rotina de mobilidade e controle motor para melhorar a qualidade do movimento e reduzir lesões.";
    rationale =
      "Mobilidade não é 'alongar': é construir amplitude de movimento ativa. A carga é baixa e o foco é controle sob tensão.";
  } else if (goal === "endurance" && days <= 4) {
    split = "cardio";
    blocks = [{ key: "cardio", label: "Condicionamento", slots: buildCardio(input) }];
    name = "Plano de Condicionamento";
    description = "Blocos intervalados com progressão de volume ao longo das semanas.";
    rationale =
      "Intervalos são o formato mais eficiente para capacidade aeróbica: mantêm a frequência cardíaca alta e cabe em menos tempo.";
  } else if (days >= 4 && (input.equipment.includes("barbell") || input.equipment.includes("dumbbell"))) {
    split = "ppl";
    const ppl = buildPpl(input);
    blocks = [
      { key: "push", label: "Empurrar (push)", slots: ppl[0] },
      { key: "pull", label: "Puxar (pull)", slots: ppl[1] },
      { key: "legs", label: "Pernas (legs)", slots: ppl[2] },
    ];
    name = "Plano Empurrar / Puxar / Pernas";
    description = `Divisão de ${days} dias focando cada grupo muscular 2x por semana.`;
    rationale =
      "A divisão empurrar/puxar/pernas permite treinar cada grupo duas vezes por semana — o equilíbrio entre recuperação e estímulo.";
  } else if (days >= 3) {
    split = "upper_lower";
    const ul = buildUpperLower(input);
    blocks = [
      { key: "upper", label: "Superior", slots: ul[0] },
      { key: "lower", label: "Inferior", slots: ul[1] },
    ];
    name = "Plano Superior / Inferior";
    description = `Divisão de ${days} dias: superior e inferior alternados, com foco em movimentos compostos.`;
    rationale =
      "Alternar superior/inferior reduz a fadiga acumulada e distribui melhor a carga por grupo muscular.";
  } else {
    split = "full_body";
    blocks = [{ key: "full", label: "Corpo Inteiro", slots: buildFullBody(input) }];
    name = "Plano Corpo Inteiro";
    description = "Treino completo 3x por semana — ideal para começar e para manter o ritmo.";
    rationale =
      "Corpo inteiro 3x por semana garante 1-2 séries por grupo por semana com recuperação suficiente entre sessões.";
  }

  // A duração estimada é POR SESSÃO: pegamos o bloco mais longo, não a soma
  // de todos os blocos (numa divisão PPL, cada bloco é um treino diferente).
  const blockSets = blocks.map((b) =>
    b.slots.reduce((acc, s) => acc + s.sets, 0),
  );
  const setsPerSession = Math.max(...blockSets, 1);
  const estMinutes = Math.min(
    120,
    Math.max(
      15,
      Math.round(
        setsPerSession * 2.6 +
          (blocks[0]?.slots.length ?? 0) * 0.8 +
          (goal === "endurance" ? input.sessionMinutes : 0),
      ),
    ),
  );

  const slots = blocks.flatMap((b) => b.slots);

  return {
    name,
    description,
    split,
    daysPerWeek: days,
    estMinutes,
    slots,
    rationale,
  };
}
