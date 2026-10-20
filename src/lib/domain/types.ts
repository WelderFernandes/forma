/**
 * Tipos de domínio do Forma.
 *
 * O SQLite não suporta enums nem listas nativas, então persistimos
 * strings e arrays-JSON. Estes tipos são a fonte da verdade do domínio
 * e são validados na borda (server actions / route handlers).
 */

export const GOALS = [
  "lose_weight",
  "build_muscle",
  "recompose",
  "mobility",
  "endurance",
  "general_health",
] as const;
export type Goal = (typeof GOALS)[number];

export const GOAL_LABELS: Record<Goal, string> = {
  lose_weight: "Emagrecer",
  build_muscle: "Ganhar massa",
  recompose: "Recomposição corporal",
  mobility: "Mobilidade e postura",
  endurance: "Condicionamento",
  general_health: "Saúde geral",
};

export const GOAL_ICONS: Record<Goal, string> = {
  lose_weight: "TrendingDown",
  build_muscle: "Dumbbell",
  recompose: "RefreshCw",
  mobility: "StretchHorizontal",
  endurance: "HeartPulse",
  general_health: "Leaf",
};

export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_LABELS: Record<Level, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

export const SEXES = ["female", "male", "other"] as const;
export type Sex = (typeof SEXES)[number];

export const EQUIPMENT = [
  "none",
  "dumbbell",
  "barbell",
  "band",
  "kettlebell",
  "machine",
  "bench",
  "bike",
  "mat",
  "step",
  "cable",
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  none: "Sem equipamento",
  dumbbell: "Halteres",
  barbell: "Barra",
  band: "Elástico",
  kettlebell: "Kettlebell",
  machine: "Aparelho",
  bench: "Banco",
  bike: "Bicicleta",
  mat: "Tapete",
  step: "Step",
  cable: "Cabo",
};

/**
 * Grupos musculares. As chaves são SEM acento porque é assim que o catálogo
 * é gravado no banco (coluna `primaryMuscle`).
 */
export const MUSCLE_GROUPS = [
  "peito",
  "costas",
  "ombro",
  "biceps",
  "triceps",
  "antebraco",
  "quadril",
  "posterior_coxa",
  "coxa",
  "panturrilha",
  "core",
  "gluteos",
  "lombar",
  "corpo_inteiro",
  "cardio",
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLE_LABELS: Record<string, string> = {
  peito: "Peito",
  costas: "Costas",
  ombro: "Ombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  antebraco: "Antebraços",
  quadril: "Quadril",
  posterior_coxa: "Posterior de coxa",
  coxa: "Coxa",
  panturrilha: "Panturrilha",
  core: "Core",
  gluteos: "Glúteos",
  lombar: "Lombar",
  corpo_inteiro: "Corpo inteiro",
  cardio: "Cardio",
};

export const CATEGORIES = [
  "strength",
  "cardio",
  "hiit",
  "pilates",
  "mobility",
  "yoga",
  "breathing",
  "core",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  strength: "Força",
  cardio: "Cardio",
  hiit: "HIIT",
  pilates: "Pilates",
  mobility: "Mobilidade",
  yoga: "Yoga",
  breathing: "Respiração",
  core: "Core",
};

export const SPLITS = [
  "full_body",
  "upper_lower",
  "ppl",
  "abc",
  "cardio",
  "mobility",
  "custom",
] as const;
export type Split = (typeof SPLITS)[number];

export const SPLIT_LABELS: Record<Split, string> = {
  full_body: "Corpo inteiro",
  upper_lower: "Superior / Inferior",
  ppl: "Push / Pull / Legs",
  abc: "ABC (Upper/Lower/Core)",
  cardio: "Cardio",
  mobility: "Mobilidade",
  custom: "Personalizado",
};

export const IMPACT_LEVELS = ["low", "moderate", "high"] as const;
export type Impact = (typeof IMPACT_LEVELS)[number];

export const MEALS = ["breakfast", "lunch", "snack", "dinner"] as const;
export type Meal = (typeof MEALS)[number];

export const MEAL_LABELS: Record<Meal, string> = {
  breakfast: "Café da manhã",
  lunch: "Almoço",
  snack: "Lanche",
  dinner: "Jantar",
};

export const ACTIVITY_LEVELS = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "athlete",
] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentário (pouco movimento no dia)",
  light: "Leve (1-2 treinos por semana)",
  moderate: "Moderado (3-5 treinos por semana)",
  active: "Ativo (6-7 treinos por semana)",
  athlete: "Atleta (treino 2x ao dia ou trabalho físico)",
};

// ───────────────────────────── JSON helpers ─────────────────────────────

/** Lê um campo JSON do SQLite com fallback seguro. */
export function parseJsonArray<T = string>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function parseJsonObject<T = Record<string, unknown>>(
  raw: string | null | undefined,
): T {
  if (!raw) return {} as T;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

export function toJsonArray(values: readonly string[] | undefined): string {
  return JSON.stringify(values ?? []);
}

/** Converte um label de músculo para a chave interna (sem acentos, minúsculo). */
export function normalizeMuscle(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z_]/g, "");
}

const MUSCLE_LABEL_BY_KEY = Object.fromEntries(
  Object.entries(MUSCLE_LABELS).map(([key, label]) => [
    normalizeMuscle(key),
    label,
  ]),
);

/** Rótulo amigável de um grupo muscular, tolerante a acento e capitalização. */
export function muscleLabel(value: string): string {
  return (
    MUSCLE_LABEL_BY_KEY[normalizeMuscle(value)] ??
    value.charAt(0).toUpperCase() + value.slice(1)
  );
}
