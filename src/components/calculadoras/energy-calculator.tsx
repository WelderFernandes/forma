"use client";

import * as React from "react";
import { adjustCalories, calculateBmr, calculateTdee } from "@/lib/domain/calculators";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/primitives";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACTIVITY_LABELS, ACTIVITY_LEVELS, GOALS, GOAL_LABELS, type ActivityLevel, type Sex } from "@/lib/domain/types";
import { formatNumber } from "@/lib/utils";

const SEX_LABELS: Record<Sex, string> = {
  female: "Feminino",
  male: "Masculino",
  other: "Outro",
};

export function EnergyCalculator() {
  const [sex, setSex] = React.useState<Sex>("female");
  const [weight, setWeight] = React.useState("70");
  const [height, setHeight] = React.useState("170");
  const [age, setAge] = React.useState("30");
  const [activity, setActivity] = React.useState<ActivityLevel>("moderate");
  const [goal, setGoal] = React.useState<string>("general_health");

  const weightValue = Number(weight);
  const heightValue = Number(height);
  const ageValue = Number(age);
  const valid = weightValue > 0 && heightValue > 50 && ageValue > 0;

  const bmr = valid ? calculateBmr({ sex, weightKg: weightValue, heightCm: heightValue, age: ageValue }) : null;
  const tdee = bmr ? calculateTdee({ bmr: bmr.bmr, activity }) : null;
  const adjustment = tdee ? adjustCalories(tdee.tdee, goal) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taxa Metabólica Basal (TMB) e Gasto Total (TDEE)</CardTitle>
        <CardDescription>
          Quanto o corpo gasta em repouso e quanto isso vira com o seu movimento diário.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="tmb-sexo">Sexo</Label>
            <Select value={sex} onValueChange={(value) => setSex(value as Sex)}>
              <SelectTrigger id="tmb-sexo">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SEX_LABELS) as Sex[]).map((option) => (
                  <SelectItem key={option} value={option}>
                    {SEX_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tmb-atividade">Nível de atividade</Label>
            <Select
              value={activity}
              onValueChange={(value) => setActivity(value as ActivityLevel)}
            >
              <SelectTrigger id="tmb-atividade">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_LEVELS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {ACTIVITY_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tmb-peso">Peso (kg)</Label>
            <Input
              id="tmb-peso"
              type="number"
              min="30"
              max="350"
              step="0.1"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tmb-altura">Altura (cm)</Label>
            <Input
              id="tmb-altura"
              type="number"
              min="100"
              max="250"
              step="0.5"
              value={height}
              onChange={(event) => setHeight(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tmb-idade">Idade (anos)</Label>
            <Input
              id="tmb-idade"
              type="number"
              min="12"
              max="99"
              value={age}
              onChange={(event) => setAge(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tmb-objetivo">Objetivo</Label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger id="tmb-objetivo">
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

        {bmr && tdee && adjustment ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-medium text-muted-foreground">TMB (metabolismo basal)</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {formatNumber(bmr.bmr)}{" "}
                  <span className="text-sm font-normal text-muted-foreground">kcal</span>
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Fórmula de {bmr.formula}: energia que o corpo gasta só para funcionar.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-medium text-muted-foreground">TDEE (gasto total)</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {formatNumber(tdee.tdee)}{" "}
                  <span className="text-sm font-normal text-muted-foreground">kcal</span>
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  TMB × {tdee.factor} ({tdee.label.replace("Fator de atividade ", "")}).
                </p>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-brand/25 bg-brand/[0.05] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">Ajuste para o seu objetivo</p>
                <Badge variant="brand">{adjustment.label}</Badge>
              </div>
              <p className="text-2xl font-semibold tabular-nums">
                {formatNumber(adjustment.calories)}{" "}
                <span className="text-sm font-normal text-muted-foreground">kcal por dia</span>
              </p>
              <p className="text-sm text-muted-foreground">{adjustment.rationale}</p>
            </div>

            <p className="text-xs text-muted-foreground">
              A TMB é uma estimativa: dias de sono, estresse, hormônios e composição corporal
              mudam o resultado em até 10%. Use como referência de tendência.
            </p>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Preencha os dados para ver o cálculo.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
