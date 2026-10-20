"use client";

import * as React from "react";
import { Beef, Droplets, Flame, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DonutChart } from "@/components/charts";
import { formatNumber } from "@/lib/utils";
import { MealLog } from "@/components/nutricao/meal-log";
import { MealPlans } from "@/components/nutricao/meal-plans";
import { Recipes } from "@/components/nutricao/recipes";
import { FastingCard, StepsCard, WaterCard } from "@/components/nutricao/tracking-cards";
import type {
  FastingDTO,
  FoodDTO,
  MealEntryDTO,
  MealPlanDTO,
  NutritionProfileDTO,
  RecipeDTO,
} from "@/components/nutricao/types";

const MACRO_COLORS = {
  protein: "var(--chart-1)",
  carbs: "var(--chart-3)",
  fat: "var(--chart-4)",
} as const;

export function NutritionView({
  profile,
  meals,
  waterTotal,
  steps,
  foods,
  plans,
  recipes,
  fasting,
}: {
  profile: NutritionProfileDTO;
  meals: MealEntryDTO[];
  waterTotal: number;
  steps: number;
  foods: FoodDTO[];
  plans: MealPlanDTO[];
  recipes: RecipeDTO[];
  fasting: FastingDTO | null;
}) {
  // Totais do dia, calculados a partir dos registros da refeição.
  const totals = React.useMemo(() => {
    const protein = meals.reduce((acc, entry) => acc + entry.protein, 0);
    const carbs = meals.reduce((acc, entry) => acc + entry.carbs, 0);
    const fat = meals.reduce((acc, entry) => acc + entry.fat, 0);
    const calories = meals.reduce((acc, entry) => acc + entry.calories, 0);
    return { protein, carbs, fat, calories };
  }, [meals]);

  // Cada macro vira calorias: proteína e carboidrato 4 kcal/g, gordura 9 kcal/g.
  const macroCalories = {
    protein: totals.protein * 4,
    carbs: totals.carbs * 4,
    fat: totals.fat * 9,
  };
  const macroTotal = macroCalories.protein + macroCalories.carbs + macroCalories.fat;

  const targetCalories = profile.targetCalories ?? 0;
  const targetProtein = profile.targetProtein ?? 0;
  const targetCarbs = profile.targetCarbs ?? 0;
  const targetFat = profile.targetFat ?? 0;

  const percent = (value: number, target: number) =>
    target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;

  const macroRows = [
    {
      key: "protein",
      label: "Proteína",
      value: totals.protein,
      target: targetProtein,
      color: MACRO_COLORS.protein,
    },
    {
      key: "carbs",
      label: "Carboidrato",
      value: totals.carbs,
      target: targetCarbs,
      color: MACRO_COLORS.carbs,
    },
    {
      key: "fat",
      label: "Gordura",
      value: totals.fat,
      target: targetFat,
      color: MACRO_COLORS.fat,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Combustível"
        title="Nutrição"
        description="Registre refeições, água, passos e jejum para acompanhar o dia sem achismos."
      />

      <Tabs defaultValue="hoje">
        <TabsList>
          <TabsTrigger value="hoje">Hoje</TabsTrigger>
          <TabsTrigger value="planos">Planos</TabsTrigger>
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
        </TabsList>

        {/* ───────────── Aba Hoje ───────────── */}
        <TabsContent value="hoje" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard
              icon={Flame}
              label="Calorias consumidas"
              value={formatNumber(totals.calories)}
              unit="kcal"
              accent="brand"
              className="col-span-2 sm:col-span-1"
              hint={
                targetCalories > 0
                  ? `Meta do perfil: ${formatNumber(targetCalories)} kcal`
                  : "Defina a meta de calorias no questionário inicial"
              }
            />
            <StatCard
              icon={Beef}
              label="Proteína"
              value={formatNumber(totals.protein, 1)}
              unit="g"
              hint={
                targetProtein > 0
                  ? `Meta do perfil: ${formatNumber(targetProtein)} g`
                  : "Sem meta de proteína definida"
              }
            />
            <StatCard
              icon={Droplets}
              label="Água"
              value={formatNumber(waterTotal)}
              unit="ml"
              hint={`Meta: ${formatNumber(profile.waterTargetMl)} ml`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Macros do dia */}
            <Card>
              <CardHeader>
                <CardTitle>Macros de hoje</CardTitle>
                <CardDescription>
                  Divisão das calorias entre proteína, carboidrato e gordura
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {macroTotal > 0 ? (
                  <DonutChart
                    segments={[
                      { label: "Proteína", value: macroCalories.protein, color: MACRO_COLORS.protein },
                      { label: "Carboidrato", value: macroCalories.carbs, color: MACRO_COLORS.carbs },
                      { label: "Gordura", value: macroCalories.fat, color: MACRO_COLORS.fat },
                    ]}
                    centerLabel="kcal dos macros"
                    centerValue={formatNumber(macroTotal)}
                    size={160}
                  />
                ) : (
                  <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    Registre uma refeição para ver a divisão de macros do dia.
                  </p>
                )}

                <div className="space-y-3">
                  {macroRows.map((row) => (
                    <div key={row.key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{row.label}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {formatNumber(row.value, 1)} g
                          {row.target > 0 ? ` / ${formatNumber(row.target)} g` : ""}
                        </span>
                      </div>
                      <Progress value={percent(row.value, row.target)} />
                    </div>
                  ))}
                </div>

                {targetCalories > 0 && (
                  <div className="space-y-1.5 rounded-xl border border-border bg-surface p-3">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <Target className="size-3.5" />
                        Total de calorias
                      </span>
                      <span className="tabular-nums">
                        {formatNumber(totals.calories)} / {formatNumber(targetCalories)} kcal
                      </span>
                    </div>
                    <Progress value={percent(totals.calories, targetCalories)} />
                    <p className="text-xs text-muted-foreground">
                      {totals.calories <= targetCalories
                        ? `Faltam ${formatNumber(targetCalories - totals.calories)} kcal para a meta de hoje.`
                        : `${formatNumber(totals.calories - targetCalories)} kcal acima da meta de hoje.`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Diário de refeições */}
            <div className="lg:col-span-2">
              <MealLog meals={meals} foods={foods} />
            </div>
          </div>

          {/* Água, passos e jejum */}
          <div className="grid gap-4 lg:grid-cols-3">
            <WaterCard total={waterTotal} target={profile.waterTargetMl} />
            <StepsCard steps={steps} target={profile.stepTarget} />
            <FastingCard
              fasting={fasting}
              profileTargetHours={profile.fastingHours}
              fastingEnabled={profile.fastingEnabled}
            />
          </div>
        </TabsContent>

        {/* ───────────── Aba Planos ───────────── */}
        <TabsContent value="planos">
          <MealPlans plans={plans} />
        </TabsContent>

        {/* ───────────── Aba Receitas ───────────── */}
        <TabsContent value="receitas">
          <Recipes recipes={recipes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
