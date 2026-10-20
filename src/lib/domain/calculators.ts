/**
 * Calculadoras de saúde e treino.
 *
 * Todas as funções retornam também o texto explicativo ("didático") para que
 * a UI nunca mostre um número solto sem contexto.
 */

import type { ActivityLevel, Sex } from "./types";
import { clamp } from "../utils";

// ───────────────────────────── Composição corporal ─────────────────────────────

export type BmiClassification = {
  value: number;
  label: string;
  color: string;
  range: string;
  advice: string;
};

export function calculateBmi(weightKg: number, heightCm: number): BmiClassification {
  const heightM = heightCm / 100;
  const value = heightM > 0 ? weightKg / (heightM * heightM) : 0;

  if (value < 18.5) {
    return {
      value,
      label: "Abaixo do peso",
      color: "sky",
      range: "< 18,5",
      advice:
        "Seu IMC está abaixo da faixa recomendada. Priorize ganho calórico de forma gradual e acompanhamento nutricional.",
    };
  }
  if (value < 25) {
    return {
      value,
      label: "Peso normal",
      color: "emerald",
      range: "18,5 – 24,9",
      advice:
        "Faixa ideal. Mantenha um rotina de treino e uma alimentação equilibrada para preservar a composição corporal.",
    };
  }
  if (value < 30) {
    return {
      value,
      label: "Sobrepeso",
      color: "amber",
      range: "25,0 – 29,9",
      advice:
        "Leve excesso de peso. Combine treino de força com déficit calórico moderado (300–500 kcal) e increase o NEAT (passos).",
    };
  }
  return {
    value,
    label: "Obesidade",
    color: "rose",
    range: "≥ 30,0",
    advice:
      "IMC acima de 30. O ideal é buscar acompanhamento profissional e definir um plano que combine treino, nutrição e acompanhamento.",
  };
}

export type BodyFatEstimate = {
  value: number;
  label: string;
  method: string;
};

export function estimateBodyFat(
  sex: Sex,
  weightKg: number,
  waistCm: number,
  neckCm: number,
  heightCm: number,
): BodyFatEstimate {
  // Fórmula de Deurenberg (BMI + razão cintura/quadril é uma aproximação mais estável)
  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? weightKg / (heightM * heightM) : 0;
  const waistHipRatio = waistCm / Math.max(1, heightM * 100 * 0.5);
  const raw = 1.2 * bmi + 0.23 * (sex === "male" ? 0 : 1) - 5.4 - 0.29 * waistHipRatio + 0.15 * (neckCm > 0 ? 0 : 0);
  const value = clamp(raw, 3, 65);

  const limits =
    sex === "male"
      ? { low: [3, 8], moderate: [9, 17], high: [18, 24], veryHigh: [25, 100] }
      : { low: [10, 13], moderate: [14, 20], high: [21, 27], veryHigh: [28, 100] };

  let label = "Composição saudável";
  if (value < limits.low[1]) label = "Atlético";
  else if (value < limits.moderate[1]) label = "Esporteiro";
  else if (value < limits.high[1]) label = "Fitness";
  else if (value < limits.veryHigh[0]) label = "Acima do ideal";

  return {
    value,
    label,
    method: "Estimativa de Deurenberg (IMC + cintura). Use para tendência, não como diagnóstico.",
  };
}

// ───────────────────────────── Energia ─────────────────────────────

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

/** Mifflin-St Jeor — padrão clínico para BMR. */
export function calculateBmr(params: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
}): { bmr: number; formula: string } {
  const { sex, weightKg, heightCm, age } = params;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = sex === "male" ? base + 5 : base - 161;
  return { bmr: Math.round(bmr), formula: "Mifflin-St Jeor" };
}

/** Harris-Benedict revisado — alternativa para conferência. */
export function calculateBmrHarrisBenedict(params: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
}): number {
  const { sex, weightKg, heightCm, age } = params;
  const base = 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.330 * age;
  return Math.round(sex === "male" ? base : base - 161);
}

export function calculateTdee(params: {
  bmr: number;
  activity: ActivityLevel;
}): { tdee: number; factor: number; label: string } {
  const factor = ACTIVITY_FACTORS[params.activity];
  return {
    tdee: Math.round(params.bmr * factor),
    factor,
    label: `Fator de atividade ${factor}`,
  };
}

export type CalorieAdjustment = {
  delta: number;
  calories: number;
  label: string;
  rationale: string;
};

/** Ajuste calórico conforme o objetivo declarado. */
export function adjustCalories(
  tdee: number,
  goal: string | null | undefined,
): CalorieAdjustment {
  switch (goal) {
    case "lose_weight":
      return {
        delta: -400,
        calories: Math.max(1200, Math.round(tdee - 400)),
        label: "Déficit moderado",
        rationale:
          "Déficit de ~400 kcal/dia estima ~0,4 kg de gordura por semana — agressivo, mas sustentável. Abaixo de 1.200 kcal o metabolismo costuma adaptar.",
      };
    case "build_muscle":
      return {
        delta: 300,
        calories: Math.round(tdee + 300),
        label: "Superávit moderado",
        rationale:
          "Superávit de ~300 kcal/dia. Ganho de massa exige excedente calórico, mas acima disso o ganho vira gordura.",
      };
    case "recompose":
      return {
        delta: -150,
        calories: Math.round(tdee - 150),
        label: "Déficit leve",
        rationale:
          "Déficit pequeno preserva a performance no treino enquanto o corpo troca gordura por músculo.",
      };
    case "endurance":
      return {
        delta: 150,
        calories: Math.round(tdee + 150),
        label: "Leve excedente",
        rationale:
          "Mais energia para volumes de cardio maiores, sem excesso que vire gordura.",
      };
    default:
      return {
        delta: 0,
        calories: Math.round(tdee),
        label: "Manutenção",
        rationale: "Manutenção do gasto basal. Ajuste conforme o peso e a performance no treino.",
      };
  }
}

export type MacroTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  proteinPerKg: number;
  rationale: string;
};

/**
 * Distribuição de macros.
 * Proteína: 1,6–2,2 g/kg (base para hipertrofia).
 * Gordura: 25% das calorias (hormonal).
 * Carboidrato: o resto — prioriza o que sustenta o treino.
 */
export function calculateMacros(params: {
  calories: number;
  weightKg: number;
  goal: string | null | undefined;
}): MacroTargets {
  const { calories, weightKg, goal } = params;
  const proteinPerKg = goal === "lose_weight" ? 2.0 : goal === "build_muscle" ? 2.2 : 1.8;
  const protein = Math.round(weightKg * proteinPerKg);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

  return {
    calories,
    protein,
    carbs,
    fat,
    proteinPerKg,
    rationale: `Proteína em ${proteinPerKg} g/kg (${protein} g) — base para síntese proteica. Gordura fixada em 25% das calorias para equilíbrio hormonal, e o restante vai para carboidratos, que são o combustível do treino.`,
  };
}

// ───────────────────────────── Treino ─────────────────────────────

export type OneRepMax = {
  value: number;
  formula: string;
};

/** Estimativas de 1RM a partir de peso e reps. */
export function calculateOneRepMax(
  weightKg: number,
  reps: number,
): OneRepMax {
  if (weightKg <= 0 || reps <= 0) return { value: 0, formula: "— " };
  if (reps === 1) return { value: weightKg, formula: "Carga real (1 rep)" };
  const epley = weightKg * (1 + reps / 30);
  const brzycki = weightKg * (36 / (37 - reps));
  const lander = (100 * weightKg) / (101.3 - 2.67123 * reps);
  const value = Math.round(Math.max(epley, Math.min(brzycki, lander)));
  return { value, formula: "Epley / Brzycki / Lander (combinadas)" };
}

/** Peso necessário para atingir N reps — usado na progressão. */
export function weightForReps(oneRepMax: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return oneRepMax;
  return Math.round(((oneRepMax * (1 + reps / 30)) / 2.5) * 2.5);
}

/** Volume de treino (séries × reps × carga). */
export function calculateVolume(sets: { weightKg: number | null; reps: number | null }[]): number {
  return sets.reduce((total, set) => {
    if (!set.weightKg || !set.reps) return total;
    return total + set.weightKg * set.reps;
  }, 0);
}

/** Calculadora de anilhas (barra de 20 kg padrão). */
export function calculatePlates(
  targetKg: number,
  barKg = 20,
  availablePlates: number[] = [25, 20, 15, 10, 5, 2.5, 1.25],
): { perSide: number[]; leftoverKg: number; note: string } {
  const perSide = [];
  let remaining = (targetKg - barKg) / 2;

  if (remaining < 0) {
    return { perSide: [], leftoverKg: targetKg - barKg, note: "Carga menor que a barra vazia." };
  }

  for (const plate of availablePlates) {
    while (remaining >= plate - 0.001) {
      perSide.push(plate);
      remaining -= plate;
    }
  }

  return {
    perSide,
    leftoverKg: Math.round(remaining * 100) / 100,
    note:
      remaining > 0.01
        ? `Não foi possível completar com as anilhas disponíveis — faltam ${remaining.toFixed(2)} kg por lado.`
        : `Barra de ${barKg} kg + ${perSide.join(" + ")} kg por lado.`,
  };
}

/**
 * Faixa de repetições por objetivo (baseado em evidências de ACSM).
 */
export function repRangeForGoal(goal: string | null | undefined): string {
  switch (goal) {
    case "build_muscle":
      return "6–12 reps (75–85% 1RM) com 10–15 sets por grupo muscular por semana";
    case "lose_weight":
      return "10–15 reps com 2–3 séries por exercício, priorizando gasto calórico total";
    case "strength":
      return "1–5 reps (85–95% 1RM) com 4–6 séries por grupo muscular";
    case "endurance":
      return "12–20 reps ou 30–60s de isometria";
    default:
      return "8–12 reps com 3 séries por exercício";
  }
}

/** Tempo de descanso sugerido por objetivo e tipo de exercício. */
export function restForGoal(
  goal: string | null | undefined,
  category: string,
): number {
  if (category === "cardio" || category === "hiit") return 30;
  if (goal === "build_muscle") return 90;
  if (goal === "strength" || goal === "build_muscle") return 120;
  if (goal === "endurance") return 45;
  return 60;
}

/** Volume semanal recomendado por grupo muscular (sets). */
export function weeklySetsForGoal(goal: string | null | undefined): string {
  switch (goal) {
    case "build_muscle":
      return "10–20 séries por grupo muscular por semana";
    case "strength":
      return "4–8 séries por grupo muscular por semana";
    case "lose_weight":
      return "8–14 séries por grupo muscular por semana";
    case "mobility":
      return "2–4 séries leves, com foco em amplitude";
    default:
      return "8–12 séries por grupo muscular por semana";
  }
}
