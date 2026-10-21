import { prisma } from "../src/lib/prisma";
import { EXERCISES_A } from "./data/exercises-a";
import { EXERCISES_B, EXERCISES_B_EXTRAS } from "./data/exercises-b";
import { FOODS, MEAL_PLANS, RECIPES } from "./data/nutrition";
import { ACHIEVEMENTS, CHALLENGES, MIND_TIPS } from "./data/wellbeing";
import { TEMPLATES } from "./data/templates";

async function main() {
  const [userCount, exerciseCount] = await Promise.all([
    prisma.user.count(),
    prisma.exercise.count(),
  ]);

  if ((userCount > 0 || exerciseCount > 0) && !process.argv.includes("--reset")) {
    throw new Error(
      "O banco já contém dados. Use `pnpm db:seed:reset` apenas em desenvolvimento ou um banco descartável.",
    );
  }

  console.log("→ Limpando banco...");
  // Ordem inversa das dependências para um reset determinístico.
  await prisma.tipRead.deleteMany();
  await prisma.userChallenge.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.mindTip.deleteMany();
  await prisma.setLog.deleteMany();
  await prisma.workoutExercise.deleteMany();
  await prisma.workoutSession.deleteMany();
  await prisma.templateExercise.deleteMany();
  await prisma.workoutTemplate.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.mealEntry.deleteMany();
  await prisma.food.deleteMany();
  await prisma.mealPlan.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.waterLog.deleteMany();
  await prisma.stepLog.deleteMany();
  await prisma.fastingSession.deleteMany();
  await prisma.bodyMetric.deleteMany();
  await prisma.cycleLog.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();

  // ─────────── Exercícios ───────────
  const exercises = [...EXERCISES_A, ...EXERCISES_B, ...EXERCISES_B_EXTRAS];
  console.log(`→ Inserindo ${exercises.length} exercícios...`);
  for (const ex of exercises) {
    await prisma.exercise.create({
      data: {
        slug: ex.slug,
        name: ex.name,
        category: ex.category,
        primaryMuscle: ex.primaryMuscle,
        secondaryMuscles: JSON.stringify(ex.secondaryMuscles),
        equipment: ex.equipment,
        difficulty: ex.difficulty,
        impact: ex.impact,
        instructions: JSON.stringify(ex.instructions),
        tips: JSON.stringify(ex.tips),
        commonMistakes: JSON.stringify(ex.commonMistakes),
        breathing: ex.breathing,
        caloriesPerMinute: ex.caloriesPerMinute,
      },
    });
  }

  // ─────────── Fichas do sistema ───────────
  console.log(`→ Inserindo ${TEMPLATES.length} fichas de treino...`);
  const exerciseBySlug = new Map(
    (await prisma.exercise.findMany({ select: { id: true, slug: true } })).map(
      (e) => [e.slug, e.id],
    ),
  );

  for (const template of TEMPLATES) {
    const items = template.items.map((item, index) => {
      const exerciseId = exerciseBySlug.get(item.slug);
      if (!exerciseId) {
        console.warn(`  ! exercício não encontrado: ${item.slug}`);
      }
      return {
        exerciseId: exerciseId ?? "",
        order: index,
        sets: item.sets,
        reps: item.reps,
        restSeconds: item.restSeconds,
        rpe: item.rpe ?? null,
        tempo: item.tempo ?? null,
        notes: item.notes ?? null,
        supersetGroup: item.supersetGroup ?? null,
      };
    });

    await prisma.workoutTemplate.create({
      data: {
        name: template.name,
        description: template.description,
        split: template.split,
        goal: template.goal,
        level: template.level,
        equipment: JSON.stringify(template.equipment),
        daysPerWeek: template.daysPerWeek,
        estMinutes: template.estMinutes,
        tags: JSON.stringify(template.tags),
        isSystem: true,
        items: { create: items },
      },
    });
  }

  // ─────────── Nutrição ───────────
  console.log(`→ Inserindo ${FOODS.length} alimentos...`);
  for (const food of FOODS) {
    await prisma.food.create({
      data: {
        slug: food.slug,
        name: food.name,
        serving: food.serving,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        category: food.category,
      },
    });
  }

  console.log(`→ Inserindo ${MEAL_PLANS.length} planos alimentares...`);
  for (const plan of MEAL_PLANS) {
    await prisma.mealPlan.create({
      data: {
        slug: plan.slug,
        title: plan.title,
        subtitle: plan.subtitle,
        description: plan.description,
        diet: plan.diet,
        calories: plan.calories,
        protein: plan.protein,
        carbs: plan.carbs,
        fat: plan.fat,
        tags: JSON.stringify(plan.tags),
        meals: JSON.stringify(plan.meals),
      },
    });
  }

  console.log(`→ Inserindo ${RECIPES.length} receitas...`);
  for (const recipe of RECIPES) {
    await prisma.recipe.create({
      data: {
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
        ingredients: JSON.stringify(recipe.ingredients),
        steps: JSON.stringify(recipe.steps),
        tags: JSON.stringify(recipe.tags),
      },
    });
  }

  // ─────────── Bem-estar ───────────
  console.log(`→ Inserindo ${MIND_TIPS.length} dicas de mentalidade...`);
  for (const tip of MIND_TIPS) {
    await prisma.mindTip.create({
      data: {
        slug: tip.slug,
        title: tip.title,
        category: tip.category,
        body: tip.body,
        takeaway: tip.takeaway,
        readTime: tip.readTime,
      },
    });
  }

  console.log(`→ Inserindo ${CHALLENGES.length} desafios...`);
  for (const challenge of CHALLENGES) {
    await prisma.challenge.create({
      data: {
        slug: challenge.slug,
        title: challenge.title,
        description: challenge.description,
        category: challenge.category,
        days: challenge.days,
        xp: challenge.xp,
        icon: challenge.icon,
        color: challenge.color,
      },
    });
  }

  console.log(`→ Inserindo ${ACHIEVEMENTS.length} conquistas...`);
  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.create({
      data: {
        slug: achievement.slug,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        xp: achievement.xp,
        category: achievement.category,
      },
    });
  }

  const counts = {
    exercicios: await prisma.exercise.count(),
    fichas: await prisma.workoutTemplate.count(),
    alimentos: await prisma.food.count(),
    planos: await prisma.mealPlan.count(),
    receitas: await prisma.recipe.count(),
    dicas: await prisma.mindTip.count(),
    desafios: await prisma.challenge.count(),
    conquistas: await prisma.achievement.count(),
  };

  console.log("\n✔ Seed concluído:");
  for (const [key, value] of Object.entries(counts)) {
    console.log(`   ${key.padEnd(12)} ${value}`);
  }
}

main()
  .catch((error) => {
    console.error("✖ Falha no seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
