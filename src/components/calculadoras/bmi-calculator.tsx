"use client";

import * as React from "react";
import { calculateBmi } from "@/lib/domain/calculators";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label, Progress } from "@/components/ui/primitives";
import { formatNumber } from "@/lib/utils";

/** Tom visual de cada faixa de IMC. */
const TONE: Record<
  string,
  { badge: "info" | "success" | "warning" | "danger"; bar: string }
> = {
  sky: { badge: "info", bar: "bg-sky-500" },
  emerald: { badge: "success", bar: "bg-emerald-500" },
  amber: { badge: "warning", bar: "bg-amber-500" },
  rose: { badge: "danger", bar: "bg-rose-500" },
};

export function BmiCalculator() {
  const [weight, setWeight] = React.useState("70");
  const [height, setHeight] = React.useState("170");

  const weightValue = Number(weight);
  const heightValue = Number(height);
  const valid = weightValue > 0 && heightValue > 50;

  const result = valid ? calculateBmi(weightValue, heightValue) : null;
  const tone = result ? (TONE[result.color] ?? TONE.emerald) : null;

  // Escala visual de 15 a 40 de IMC.
  const percent = result
    ? Math.max(0, Math.min(100, ((result.value - 15) / 25) * 100))
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Índice de Massa Corporal (IMC)</CardTitle>
        <CardDescription>
          Relação entre peso e altura. Serve como triagem rápida, não como diagnóstico.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="imc-peso">Peso (kg)</Label>
            <Input
              id="imc-peso"
              type="number"
              min="30"
              max="350"
              step="0.1"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="imc-altura">Altura (cm)</Label>
            <Input
              id="imc-altura"
              type="number"
              min="100"
              max="250"
              step="0.5"
              value={height}
              onChange={(event) => setHeight(event.target.value)}
            />
          </div>
        </div>

        {result && tone ? (
          <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums">
                  {formatNumber(result.value, 1)}
                </span>
                <span className="text-sm text-muted-foreground">kg/m²</span>
              </div>
              <Badge variant={tone.badge}>{result.label}</Badge>
            </div>

            <Progress
              value={percent}
              indicatorClassName={tone.bar}
            />

            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>15</span>
              <span>Faixa desta classificação: {result.range}</span>
              <span>40</span>
            </div>

            <p className="text-sm text-muted-foreground">{result.advice}</p>

            <p className="text-xs text-muted-foreground">
              Fórmula: IMC = peso (kg) ÷ (altura em metros)². A faixa de referência da OMS
              para adultos é 18,5 a 24,9 kg/m².
            </p>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Preencha peso e altura para ver o resultado.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
