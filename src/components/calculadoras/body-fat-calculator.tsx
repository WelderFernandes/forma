"use client";

import * as React from "react";
import { estimateBodyFat } from "@/lib/domain/calculators";
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
import type { Sex } from "@/lib/domain/types";
import { formatNumber } from "@/lib/utils";

const SEX_LABELS: Record<Sex, string> = {
  female: "Feminino",
  male: "Masculino",
  other: "Outro",
};

export function BodyFatCalculator() {
  const [sex, setSex] = React.useState<Sex>("female");
  const [weight, setWeight] = React.useState("70");
  const [waist, setWaist] = React.useState("80");
  const [neck, setNeck] = React.useState("36");
  const [height, setHeight] = React.useState("170");

  const weightValue = Number(weight);
  const waistValue = Number(waist);
  const neckValue = Number(neck);
  const heightValue = Number(height);
  const valid =
    weightValue > 0 && waistValue > 0 && neckValue > 0 && heightValue > 50;

  const result = valid
    ? estimateBodyFat(sex, weightValue, waistValue, neckValue, heightValue)
    : null;

  const referencia =
    sex === "male"
      ? "homens, as faixas de referência ficam entre 8% e 19%"
      : "mulheres, as faixas de referência ficam entre 13% e 24%";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estimativa de Gordura Corporal</CardTitle>
        <CardDescription>
          Estimativa a partir de peso, cintura, pescoço e altura. Use para acompanhar tendência.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="gordura-sexo">Sexo</Label>
            <Select value={sex} onValueChange={(value) => setSex(value as Sex)}>
              <SelectTrigger id="gordura-sexo">
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
            <Label htmlFor="gordura-peso">Peso (kg)</Label>
            <Input
              id="gordura-peso"
              type="number"
              min="30"
              max="350"
              step="0.1"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gordura-cintura">Cintura (cm)</Label>
            <Input
              id="gordura-cintura"
              type="number"
              min="30"
              max="250"
              step="0.5"
              value={waist}
              onChange={(event) => setWaist(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gordura-pescoco">Pescoço (cm)</Label>
            <Input
              id="gordura-pescoco"
              type="number"
              min="20"
              max="70"
              step="0.5"
              value={neck}
              onChange={(event) => setNeck(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gordura-altura">Altura (cm)</Label>
            <Input
              id="gordura-altura"
              type="number"
              min="100"
              max="250"
              step="0.5"
              value={height}
              onChange={(event) => setHeight(event.target.value)}
            />
          </div>
        </div>

        {result ? (
          <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-3xl font-semibold tabular-nums">
                {formatNumber(result.value, 1)}{" "}
                <span className="text-sm font-normal text-muted-foreground">%</span>
              </p>
              <Badge variant="brand">{result.label}</Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              Com {formatNumber(result.value, 1)}% de gordura corporal, o seu peso magro estimado
              é de aproximadamente {formatNumber(weightValue * (1 - result.value / 100), 1)} kg.
            </p>

            <p className="text-xs text-muted-foreground">
              {result.method} Para {referencia}.
            </p>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Preencha as medidas para estimar a composição corporal.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
