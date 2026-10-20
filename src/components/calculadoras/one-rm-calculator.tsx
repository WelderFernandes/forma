"use client";

import * as React from "react";
import { calculateOneRepMax, weightForReps } from "@/lib/domain/calculators";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/primitives";
import { formatNumber } from "@/lib/utils";

const REP_TARGETS = [3, 5, 8, 10];

export function OneRmCalculator() {
  const [weight, setWeight] = React.useState("80");
  const [reps, setReps] = React.useState("5");

  const weightValue = Number(weight);
  const repsValue = Math.round(Number(reps));
  const valid = weightValue > 0 && repsValue > 0;

  const result = valid ? calculateOneRepMax(weightValue, repsValue) : null;
  const suggestions =
    result && result.value > 0
      ? REP_TARGETS.map((target) => ({
          reps: target,
          weight: weightForReps(result.value, target),
          percent: Math.round((weightForReps(result.value, target) / result.value) * 100),
        }))
      : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estimativa de Carga Máxima (1RM)</CardTitle>
        <CardDescription>
          Quanto você move com uma repetição, a partir de uma série que você já consegue fazer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="rm-peso">Carga utilizada (kg)</Label>
            <Input
              id="rm-peso"
              type="number"
              min="1"
              max="500"
              step="0.5"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rm-reps">Repetições feitas</Label>
            <Input
              id="rm-reps"
              type="number"
              min="1"
              max="30"
              value={reps}
              onChange={(event) => setReps(event.target.value)}
            />
          </div>
        </div>

        {result && result.value > 0 ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-brand/25 bg-brand/[0.05] p-4">
              <p className="text-xs font-medium text-muted-foreground">Sua carga máxima estimada</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">
                {formatNumber(result.value)}{" "}
                <span className="text-sm font-normal text-muted-foreground">kg</span>
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Método: {result.formula}. A estimativa vale para cargas de até cerca de 10
                repetições e fica mais precisa quanto mais perto do limite for a série.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Cargas sugeridas para as próximas sessões</p>
              <ul className="space-y-2">
                {suggestions.map((item) => (
                  <li
                    key={item.reps}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2.5"
                  >
                    <span className="text-sm">
                      Para <strong>{item.reps} repetições</strong>
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {item.percent}% do 1RM
                      </Badge>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatNumber(item.weight)} kg
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-muted-foreground">
              Progressão prática: comece com 80% da carga estimada e aumente 2,5 kg por semana,
              mantendo 2 a 3 repetições de reserva. A carga de 1RM real costuma ser menor que a
              estimativa — o indicador continua sendo a técnica.
            </p>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Preencha a carga e as repetições para estimar a carga máxima.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
