"use client";

import * as React from "react";
import { Droplets, Footprints, Timer, TimerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label, Progress } from "@/components/ui/primitives";
import { logSteps, logWater, startFasting, stopFasting } from "@/server/actions/nutrition";
import { formatDuration, formatNumber } from "@/lib/utils";
import type { FastingDTO } from "@/components/nutricao/types";

/* ───────────────────────────── Água ───────────────────────────── */

export function WaterCard({ total, target }: { total: number; target: number }) {
  const [amount, setAmount] = React.useState("");
  const [saving, startSave] = React.useTransition();

  const percent = target > 0 ? Math.min(100, Math.round((total / target) * 100)) : 0;

  function addWater(value: number) {
    if (!Number.isFinite(value) || value <= 0) return;
    startSave(async () => {
      await logWater(Math.round(value));
      setAmount("");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <Droplets className="size-4 text-sky-500" />
          Água
        </CardTitle>
        <CardDescription>Meta diária de hidratação</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-semibold tabular-nums">
              {formatNumber(total)} ml
            </span>
            <span className="text-xs text-muted-foreground">de {formatNumber(target)} ml</span>
          </div>
          <Progress value={percent} />
          <p className="text-xs text-muted-foreground">
            {percent >= 100
              ? "Meta de água batida hoje. Bom trabalho."
              : `Faltam ${formatNumber(Math.max(0, target - total))} ml para completar a meta.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" disabled={saving} onClick={() => addWater(250)}>
            +250 ml
          </Button>
          <Button variant="secondary" size="sm" disabled={saving} onClick={() => addWater(500)}>
            +500 ml
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="agua-personalizado">Quantidade personalizada</Label>
          <div className="flex gap-2">
            <Input
              id="agua-personalizado"
              type="number"
              min="50"
              step="50"
              value={amount}
              placeholder="ml"
              onChange={(event) => setAmount(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addWater(Number(amount));
                }
              }}
            />
            <Button
              variant="brand"
              disabled={saving || !amount}
              onClick={() => addWater(Number(amount))}
            >
              Registrar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────────── Passos ───────────────────────────── */

export function StepsCard({ steps, target }: { steps: number; target: number }) {
  const [value, setValue] = React.useState(String(steps || ""));
  const [saving, startSave] = React.useTransition();

  const percent = target > 0 ? Math.min(100, Math.round((steps / target) * 100)) : 0;

  function save() {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    startSave(async () => {
      await logSteps(Math.round(parsed));
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <Footprints className="size-4 text-brand" />
          Passos
        </CardTitle>
        <CardDescription>Meta de passos do dia</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-semibold tabular-nums">
              {formatNumber(steps)}
            </span>
            <span className="text-xs text-muted-foreground">de {formatNumber(target)} passos</span>
          </div>
          <Progress value={percent} />
          <p className="text-xs text-muted-foreground">
            {steps >= target
              ? "Meta de passos concluída hoje."
              : `Faltam ${formatNumber(Math.max(0, target - steps))} passos para bater a meta.`}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="passos">Passos de hoje</Label>
          <div className="flex gap-2">
            <Input
              id="passos"
              type="number"
              min="0"
              step="100"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  save();
                }
              }}
            />
            <Button variant="brand" disabled={saving} onClick={save}>
              Salvar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────────── Jejum ───────────────────────────── */

const FASTING_OPTIONS = [14, 16, 18, 20];

export function FastingCard({
  fasting,
  profileTargetHours,
  fastingEnabled,
}: {
  fasting: FastingDTO | null;
  profileTargetHours: number;
  fastingEnabled: boolean;
}) {
  const [hours, setHours] = React.useState(
    FASTING_OPTIONS.includes(profileTargetHours) ? profileTargetHours : 16,
  );
  const [now, setNow] = React.useState<number | null>(null);
  const [saving, startSave] = React.useTransition();

  // Atualiza o relógio do jejum uma vez por segundo.
  React.useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsedSeconds = fasting && now
    ? Math.max(0, Math.floor((now - new Date(fasting.startedAt).getTime()) / 1000))
    : 0;
  const goalSeconds = (fasting?.targetHours ?? hours) * 3600;
  const remainingSeconds = Math.max(0, goalSeconds - elapsedSeconds);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <Timer className="size-4 text-amber-500" />
          Jejum intermitente
        </CardTitle>
        <CardDescription>
          {fastingEnabled
            ? `Meta de jejum do perfil: ${profileTargetHours} horas`
            : "Jejum desativado no perfil, mas você pode iniciar uma sessão aqui."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fasting ? (
          <>
            <div className="space-y-1.5">
              <p className="text-2xl font-semibold tabular-nums">
                {formatDuration(elapsedSeconds)}
              </p>
              <Progress
                value={goalSeconds > 0 ? Math.min(100, (elapsedSeconds / goalSeconds) * 100) : 0}
              />
              <p className="text-xs text-muted-foreground">
                {remainingSeconds > 0
                  ? `Faltam ${formatDuration(remainingSeconds)} para completar ${fasting.targetHours}h de jejum.`
                  : `Meta de ${fasting.targetHours}h de jejum concluída. Você pode encerrar quando quiser.`}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              disabled={saving}
              onClick={() =>
                startSave(async () => {
                  await stopFasting();
                })
              }
            >
              <TimerOff className="size-4" />
              Encerrar jejum
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label>Escolha a duração</Label>
              <div className="grid grid-cols-4 gap-2">
                {FASTING_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setHours(option)}
                    className={`rounded-xl border px-2 py-2 text-sm font-medium transition-colors ${
                      hours === option
                        ? "border-brand bg-brand/15 text-brand"
                        : "border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {option}h
                  </button>
                ))}
              </div>
            </div>
            <Button
              variant="brand"
              className="w-full"
              disabled={saving}
              onClick={() =>
                startSave(async () => {
                  await startFasting(hours);
                })
              }
            >
              <Timer className="size-4" />
              Iniciar jejum de {hours} horas
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
