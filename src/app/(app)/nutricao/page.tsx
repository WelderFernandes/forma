import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { parseJsonArray } from "@/lib/domain/types";
import { getCurrentUser } from "@/server/auth-helpers";
import { getNutritionDay, getProfile } from "@/server/queries";
import { NutritionView } from "@/components/nutricao/nutrition-view";
import type {
  FastingDTO,
  FoodDTO,
  MealEntryDTO,
  MealPlanDTO,
  PlanMealDTO,
  RecipeDTO,
} from "@/components/nutricao/types";

export const metadata: Metadata = {
  title: "Nutrição",
};

export default async function NutritionPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [profile, day, foods, plans, recipes, fasting] = await Promise.all([
    getProfile(user.id),
    getNutritionDay(user.id, new Date()),
    prisma.food.findMany({ orderBy: { name: "asc" } }),
    prisma.mealPlan.findMany({ orderBy: { title: "asc" } }),
    prisma.recipe.findMany({ orderBy: { title: "asc" } }),
    prisma.fastingSession.findFirst({
      where: { userId: user.id, status: "active" },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  const mealEntries: MealEntryDTO[] = day.meals.map((entry) => ({
    id: entry.id,
    meal: entry.meal,
    name: entry.name,
    serving: entry.serving,
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
  }));

  const foodCatalog: FoodDTO[] = foods.map((food) => ({
    id: food.id,
    name: food.name,
    serving: food.serving,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    category: food.category,
  }));

  const mealPlans: MealPlanDTO[] = plans.map((plan) => ({
    id: plan.id,
    slug: plan.slug,
    title: plan.title,
    subtitle: plan.subtitle,
    description: plan.description,
    diet: plan.diet,
    calories: plan.calories,
    protein: plan.protein,
    carbs: plan.carbs,
    fat: plan.fat,
    tags: parseJsonArray<string>(plan.tags),
    meals: parseJsonArray<PlanMealDTO>(plan.meals).map((meal) => ({
      name: meal.name,
      items: Array.isArray(meal.items) ? meal.items : [],
      calories: meal.calories ?? 0,
    })),
  }));

  const recipeList: RecipeDTO[] = recipes.map((recipe) => ({
    id: recipe.id,
    slug: recipe.slug,
    title: recipe.title,
    description: recipe.description,
    meal: recipe.meal,
    diet: recipe.diet,
    prepMinutes: recipe.prepMinutes,
    servings: recipe.servings,
    calories: recipe.calories,
    protein: recipe.protein,
    carbs: recipe.carbs,
    fat: recipe.fat,
    ingredients: parseJsonArray<string>(recipe.ingredients),
    steps: parseJsonArray<string>(recipe.steps),
    tags: parseJsonArray<string>(recipe.tags),
  }));

  const activeFasting: FastingDTO | null = fasting
    ? { startedAt: fasting.startedAt.toISOString(), targetHours: fasting.targetHours }
    : null;

  return (
    <NutritionView
      profile={{
        targetCalories: profile?.targetCalories ?? null,
        targetProtein: profile?.targetProtein ?? null,
        targetCarbs: profile?.targetCarbs ?? null,
        targetFat: profile?.targetFat ?? null,
        waterTargetMl: profile?.waterTargetMl ?? 2000,
        stepTarget: profile?.stepTarget ?? 8000,
        fastingEnabled: profile?.fastingEnabled ?? false,
        fastingHours: profile?.fastingHours ?? 16,
      }}
      meals={mealEntries}
      waterTotal={day.water.reduce((acc, log) => acc + log.amountMl, 0)}
      steps={day.steps?.steps ?? 0}
      foods={foodCatalog}
      plans={mealPlans}
      recipes={recipeList}
      fasting={activeFasting}
    />
  );
}
