"use client";

import * as React from "react";
import { calculateMacros } from "@/lib/domain/calculators";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label, Progress } from "@/components/ui/primitives";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GOALS, GOAL_LABELS } from "@/lib/domain/types";
import { formatNumber } from "@/lib/utils";

export function MacrosCalculator() {
  const [calories, setCalories] = React.useState("2200");
  const [weight, setWeight] = React.useState("70");
  const [goal, setGoal] = React.useState<string>("general_health");

  const caloriesValue = Number(calories);
  const weightValue = Number(weight);
  const valid = caloriesValue > 0 && weightValue > 0;

  const result = valid
    ? calculateMacros({ calories: Math.round(caloriesValue), weightKg: weightValue, goal })
    : null;

  const rows = result
    ? [
        {
          label: "Proteína",
          grams: result.protein,
          kcal: result.protein * 4,
          color: "bg-brand",
        },
        {
          label: "Carboidrato",
          grams: result.carbs,
          kcal: result.carbs * 4,
          color: "bg-amber-500",
        },
        {
          label: "Gordura",
          grams: result.fat,
          kcal: result.fat * 9,
          color: "bg-sky-500",
        },
      ]
    : [];

  const totalKcal = rows.reduce((acc, row) => acc + row.kcal, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Macronutrientes</CardTitle>
        <CardDescription>
          Quantos gramas de proteína, carboidrato e gordura cabem nas calorias do dia.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="macro-calorias">Calorias por dia (kcal)</Label>
            <Input
              id="macro-calorias"
              type="number"
              min="800"
              max="5000"
              step="10"
              value={calories}
              onChange={(event) => setCalories(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="macro-peso">Peso (kg)</Label>
            <Input
              id="macro-peso"
              type="number"
              min="30"
              max="350"
              step="0.1"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="macro-objetivo">Objetivo</Label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger id="macro-objetivo">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {GOALS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {GOAL_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {rows.map((row) => (
                <div key={row.label} className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs font-medium text-muted-foreground">{row.label}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {formatNumber(row.grams)}{" "}
                    <span className="text-sm font-normal text-muted-foreground">g</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {totalKcal > 0
                      ? `${Math.round((row.kcal / totalKcal) * 100)}% das calorias`
                      : "—"}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 rounded-xl border border-border bg-surface p-4">
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-secondary">
                {rows.map((row) => (
                  <span
                    key={row.label}
                    className={row.color}
                    style={{ width: `${totalKcal > 0 ? (row.kcal / totalKcal) * 100 : 0}%` }}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{result.rationale}</p>
              <p className="text-xs text-muted-foreground">
                Proteína: {formatNumber(result.proteinPerKg, 1)} g/kg · Gordura fixada em 25% das
                calorias · Carboidrato cobre a diferença. Ajustes finos de +-10 g ficam a critério
                da sua fome, do treino e da resposta do corpo.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">Soma das calorias dos macros</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatNumber(totalKcal)} kcal
                </span>
              </div>
              <Progress
                value={
                  result.calories > 0
                    ? Math.min(100, Math.round((totalKcal / result.calories) * 100))
                    : 0
                }
              />
            </div>

            <Badge variant="outline">Fórmula base: 1,6 a 2,2 g de proteína por kg de peso</Badge>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Preencha calorias e peso para ver a distribuição.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
