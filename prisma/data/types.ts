/**
 * Tipos compartilhados pelos arquivos de seed.
 */

export type SeedExercise = {
  slug: string;
  name: string;
  category: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  difficulty: string;
  impact: string;
  instructions: string[];
  tips: string[];
  commonMistakes: string[];
  breathing: string;
  caloriesPerMinute: number;
};

export type SeedTemplate = {
  slug: string;
  name: string;
  description: string;
  split: string;
  goal: string;
  level: string;
  equipment: string[];
  daysPerWeek: number;
  estMinutes: number;
  tags: string[];
  items: {
    slug: string;
    sets: number;
    reps: string;
    restSeconds: number;
    rpe?: number;
    tempo?: string;
    notes?: string;
    supersetGroup?: string;
  }[];
};

export type SeedFood = {
  slug: string;
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: string;
};

export type SeedMealPlan = {
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
  meals: { name: string; items: string[]; calories: number }[];
};

export type SeedRecipe = {
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

export type SeedMindTip = {
  slug: string;
  title: string;
  category: string;
  body: string;
  takeaway: string;
  readTime: number;
};

export type SeedChallenge = {
  slug: string;
  title: string;
  description: string;
  category: string;
  days: number;
  xp: number;
  icon: string;
  color: string;
};

export type SeedAchievement = {
  slug: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
  category: string;
};
