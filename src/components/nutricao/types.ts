/**
 * Tipos serializáveis usados nas telas de nutrição.
 *
 * As páginas (server components) convertem os registros do Prisma para
 * estes tipos simples antes de repassá-los aos componentes interativos.
 */

export type MealEntryDTO = {
  id: string;
  meal: string;
  name: string;
  serving: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type FoodDTO = {
  id: string;
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: string;
};

export type PlanMealDTO = {
  name: string;
  items: string[];
  calories: number;
};

export type MealPlanDTO = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  diet: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
  meals: PlanMealDTO[];
};

export type RecipeDTO = {
  id: string;
  slug: string;
  title: string;
  description: string;
  meal: string;
  diet: string;
  prepMinutes: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  steps: string[];
  tags: string[];
};

/** Metas do perfil usadas na tela de nutrição. */
export type NutritionProfileDTO = {
  targetCalories: number | null;
  targetProtein: number | null;
  targetCarbs: number | null;
  targetFat: number | null;
  waterTargetMl: number;
  stepTarget: number;
  fastingEnabled: boolean;
  fastingHours: number;
};

/** Sessão de jejum em andamento (ou null quando não há). */
export type FastingDTO = {
  startedAt: string;
  targetHours: number;
};
