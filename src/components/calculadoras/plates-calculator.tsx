"use client";

import * as React from "react";
import { calculatePlates } from "@/lib/domain/calculators";
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
import { formatNumber } from "@/lib/utils";

const BAR_OPTIONS = [20, 15, 10];

export function PlatesCalculator() {
  const [target, setTarget] = React.useState("100");
  const [bar, setBar] = React.useState("20");

  const targetValue = Number(target);
  const barValue = Number(bar);
  const valid = targetValue > 0 && barValue > 0;

  const result = valid ? calculatePlates(targetValue, barValue) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculadora de Anilhas</CardTitle>
        <CardDescription>
          Quais anilhas colocar em cada lado da barra para chegar na carga desejada.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="anilhas-carga">Carga total desejada (kg)</Label>
            <Input
              id="anilhas-carga"
              type="number"
              min="1"
              max="500"
              step="2.5"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="anilhas-barra">Peso da barra</Label>
            <Select value={bar} onValueChange={setBar}>
              <SelectTrigger id="anilhas-barra">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {BAR_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option} kg
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Anilhas por lado (barra de {barValue} kg)
              </p>
              {result.perSide.length > 0 ? (
                <>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.perSide.map((plate, index) => (
                      <span
                        key={`${plate}-${index}`}
                        className="flex size-12 items-center justify-center rounded-full border-2 border-foreground/70 bg-secondary text-xs font-bold tabular-nums"
                      >
                        {formatNumber(plate, plate % 1 === 0 ? 0 : 2)}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm font-medium">{result.note}</p>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">{result.note}</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Resumo da montagem</p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>
                  Barra: <strong className="text-foreground">{barValue} kg</strong>
                </li>
                <li>
                  Anilhas por lado:{" "}
                  <strong className="text-foreground">
                    {result.perSide.length > 0
                      ? `${formatNumber(
                          result.perSide.reduce((acc, plate) => acc + plate, 0),
                          2,
                        )} kg`
                      : "—"}
                  </strong>
                </li>
                <li>
                  Total montado:{" "}
                  <strong className="text-foreground">
                    {formatNumber(
                      barValue + result.perSide.reduce((acc, plate) => acc + plate, 0) * 2,
                      2,
                    )}{" "}
                    kg
                  </strong>
                </li>
                {result.leftoverKg > 0.01 && (
                  <li>
                    Diferença para a carga pedida:{" "}
                    <strong className="text-foreground">
                      {formatNumber(result.leftoverKg * 2, 2)} kg
                    </strong>
                  </li>
                )}
              </ul>
            </div>

            <Badge variant="outline">
              Anilhas disponíveis: 25, 20, 15, 10, 5, 2,5 e 1,25 kg
            </Badge>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Informe a carga desejada para montar a barra.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
