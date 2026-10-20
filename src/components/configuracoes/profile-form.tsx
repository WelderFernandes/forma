"use client";

import * as React from "react";
import { Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label, Separator, Switch } from "@/components/ui/primitives";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProfile } from "@/server/actions/profile";
import {
  ACTIVITY_LABELS,
  ACTIVITY_LEVELS,
  EQUIPMENT,
  EQUIPMENT_LABELS,
  GOALS,
  GOAL_LABELS,
  LEVELS,
  LEVEL_LABELS,
  type ActivityLevel,
  type Equipment,
  type Goal,
  type Level,
} from "@/lib/domain/types";
import { titleCase } from "@/lib/utils";

export type ProfileFormValues = {
  heightCm: number | null;
  weightKg: number | null;
  goal: string | null;
  level: string | null;
  daysPerWeek: number;
  sessionMinutes: number;
  equipment: string[];
  focusAreas: string[];
  lowImpact: boolean;
  waterTargetMl: number;
  stepTarget: number;
  fastingEnabled: boolean;
  fastingHours: number;
};

/** Áreas de foco sugeridas — o valor gravado é o texto à esquerda. */
const FOCUS_OPTIONS = [
  { value: "forca", label: "Força" },
  { value: "hipertrofia", label: "Hipertrofia" },
  { value: "mobilidade", label: "Mobilidade" },
  { value: "resistencia", label: "Resistência" },
  { value: "cardio", label: "Condicionamento" },
  { value: "core", label: "Core" },
  { value: "postura", label: "Postura" },
  { value: "flexibilidade", label: "Flexibilidade" },
];

function toNumber(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function ProfileForm({
  name,
  sexLabel,
  initial,
}: {
  name: string;
  sexLabel: string;
  initial: ProfileFormValues;
}) {
  const [heightCm, setHeightCm] = React.useState(
    initial.heightCm !== null ? String(initial.heightCm) : "",
  );
  const [weightKg, setWeightKg] = React.useState(
    initial.weightKg !== null ? String(initial.weightKg) : "",
  );
  const [goal, setGoal] = React.useState<string>(initial.goal ?? "general_health");
  const [level, setLevel] = React.useState<string>(initial.level ?? "beginner");
  const [daysPerWeek, setDaysPerWeek] = React.useState(String(initial.daysPerWeek));
  const [sessionMinutes, setSessionMinutes] = React.useState(String(initial.sessionMinutes));
  const [equipment, setEquipment] = React.useState<string[]>(initial.equipment);
  const [focusAreas, setFocusAreas] = React.useState<string[]>(initial.focusAreas);
  const [lowImpact, setLowImpact] = React.useState(initial.lowImpact);
  const [activity, setActivity] = React.useState<ActivityLevel>("moderate");
  const [waterTargetMl, setWaterTargetMl] = React.useState(String(initial.waterTargetMl));
  const [stepTarget, setStepTarget] = React.useState(String(initial.stepTarget));
  const [fastingEnabled, setFastingEnabled] = React.useState(initial.fastingEnabled);
  const [fastingHours, setFastingHours] = React.useState(String(initial.fastingHours));

  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [saving, startSave] = React.useTransition();

  // Áreas de foco: opções conhecidas + valores já gravados que não estão na lista.
  const focusOptions = React.useMemo(() => {
    const known = FOCUS_OPTIONS.map((option) => option.value);
    const extras = initial.focusAreas
      .filter((value) => !known.includes(value))
      .map((value) => ({ value, label: titleCase(value) }));
    return [...FOCUS_OPTIONS, ...extras];
  }, [initial.focusAreas]);

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const parsedHeight = toNumber(heightCm);
    const parsedWeight = toNumber(weightKg);
    const parsedDays = Math.round(toNumber(daysPerWeek));
    const parsedMinutes = Math.round(toNumber(sessionMinutes));
    const parsedWater = Math.round(toNumber(waterTargetMl));
    const parsedSteps = Math.round(toNumber(stepTarget));
    const parsedFastingHours = Math.round(toNumber(fastingHours));

    if (parsedHeight < 100 || parsedHeight > 250) {
      setError("A altura precisa estar entre 100 e 250 cm.");
      return;
    }
    if (parsedWeight < 30 || parsedWeight > 350) {
      setError("O peso precisa estar entre 30 e 350 kg.");
      return;
    }
    if (parsedDays < 2 || parsedDays > 6) {
      setError("Os dias por semana precisam estar entre 2 e 6.");
      return;
    }
    if (parsedMinutes < 10 || parsedMinutes > 120) {
      setError("Os minutos por sessão precisam estar entre 10 e 120.");
      return;
    }
    if (parsedWater < 500 || parsedWater > 6000) {
      setError("A meta de água precisa estar entre 500 e 6000 ml.");
      return;
    }
    if (parsedSteps < 1000 || parsedSteps > 30000) {
      setError("A meta de passos precisa estar entre 1000 e 30000.");
      return;
    }
    if (fastingEnabled && (parsedFastingHours < 12 || parsedFastingHours > 24)) {
      setError("As horas de jejum precisam estar entre 12 e 24.");
      return;
    }

    startSave(async () => {
      try {
        await updateProfile({
          heightCm: parsedHeight,
          weightKg: parsedWeight,
          goal,
          level,
          daysPerWeek: parsedDays,
          sessionMinutes: parsedMinutes,
          equipment,
          focusAreas,
          lowImpact,
          activity,
          waterTargetMl: parsedWater,
          stepTarget: parsedSteps,
          fastingEnabled,
          fastingHours: parsedFastingHours,
        });
        setSaved(true);
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Não foi possível salvar as configurações.",
        );
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil de treino e nutrição</CardTitle>
        <CardDescription>
          Estes dados alimentam o gerador de treinos, as metas de calorias e as recomendações.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identificação */}
          <section className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cfg-nome">Nome</Label>
              <Input id="cfg-nome" value={name} readOnly disabled />
              <p className="text-xs text-muted-foreground">
                O nome vem do cadastro e não pode ser alterado por aqui.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cfg-sexo">Sexo</Label>
              <Input id="cfg-sexo" value={sexLabel} readOnly disabled />
              <p className="text-xs text-muted-foreground">
                Definido no cadastro inicial — é usado nas fórmulas de metabolismo e gordura
                corporal.
              </p>
            </div>
          </section>

          <Separator />

          {/* Medidas */}
          <section className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cfg-altura">Altura (cm)</Label>
              <Input
                id="cfg-altura"
                type="number"
                min="100"
                max="250"
                step="0.5"
                value={heightCm}
                onChange={(event) => setHeightCm(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cfg-peso">Peso (kg)</Label>
              <Input
                id="cfg-peso"
                type="number"
                min="30"
                max="350"
                step="0.1"
                value={weightKg}
                onChange={(event) => setWeightKg(event.target.value)}
              />
            </div>
          </section>

          <Separator />

          {/* Objetivos e rotina */}
          <section className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cfg-objetivo">Objetivo</Label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger id="cfg-objetivo">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {GOALS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {GOAL_LABELS[option as Goal]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cfg-nivel">Nível</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger id="cfg-nivel">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {LEVEL_LABELS[option as Level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cfg-dias">Dias por semana</Label>
              <Input
                id="cfg-dias"
                type="number"
                min="2"
                max="6"
                value={daysPerWeek}
                onChange={(event) => setDaysPerWeek(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cfg-minutos">Minutos por sessão</Label>
              <Input
                id="cfg-minutos"
                type="number"
                min="10"
                max="120"
                step="5"
                value={sessionMinutes}
                onChange={(event) => setSessionMinutes(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cfg-atividade">Nível de atividade</Label>
              <Select
                value={activity}
                onValueChange={(value) => setActivity(value as ActivityLevel)}
              >
                <SelectTrigger id="cfg-atividade">
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
              <p className="text-xs text-muted-foreground">
                Define o fator de atividade usado para estimar o gasto diário e recalcular as
                metas de calorias e macros.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3 sm:col-span-2">
              <div className="space-y-0.5">
                <Label htmlFor="cfg-baixo-impacto">Treino de baixo impacto</Label>
                <p className="text-xs text-muted-foreground">
                  Evita saltos e impactos fortes, priorizando articulações e joelhos.
                </p>
              </div>
              <Switch
                id="cfg-baixo-impacto"
                checked={lowImpact}
                onCheckedChange={setLowImpact}
              />
            </div>
          </section>

          <Separator />

          {/* Equipamento */}
          <section className="space-y-2.5">
            <Label>Equipamento disponível</Label>
            <p className="text-xs text-muted-foreground">
              O gerador de treinos usa esta lista para sugerir exercícios possíveis.
            </p>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT.map((option) => {
                const active = equipment.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggle(equipment, option, setEquipment)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "border-brand bg-brand/15 text-brand"
                        : "border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {EQUIPMENT_LABELS[option as Equipment]}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Áreas de foco */}
          <section className="space-y-2.5">
            <Label>Áreas de foco</Label>
            <p className="text-xs text-muted-foreground">
              Prioridades que o plano de treino deve respeitar.
            </p>
            <div className="flex flex-wrap gap-2">
              {focusOptions.map((option) => {
                const active = focusAreas.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggle(focusAreas, option.value, setFocusAreas)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "border-brand bg-brand/15 text-brand"
                        : "border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>

          <Separator />

          {/* Nutrição */}
          <section className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cfg-agua">Meta de água (ml)</Label>
              <Input
                id="cfg-agua"
                type="number"
                min="500"
                max="6000"
                step="100"
                value={waterTargetMl}
                onChange={(event) => setWaterTargetMl(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cfg-passos">Meta de passos</Label>
              <Input
                id="cfg-passos"
                type="number"
                min="1000"
                max="30000"
                step="500"
                value={stepTarget}
                onChange={(event) => setStepTarget(event.target.value)}
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3 sm:col-span-2">
              <div className="space-y-0.5">
                <Label htmlFor="cfg-jejum">Jejum intermitente</Label>
                <p className="text-xs text-muted-foreground">
                  Habilita o acompanhamento de sessões de jejum na aba de nutrição.
                </p>
              </div>
              <Switch
                id="cfg-jejum"
                checked={fastingEnabled}
                onCheckedChange={setFastingEnabled}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cfg-jejum-horas">Horas de jejum</Label>
              <Input
                id="cfg-jejum-horas"
                type="number"
                min="12"
                max="24"
                value={fastingHours}
                disabled={!fastingEnabled}
                onChange={(event) => setFastingHours(event.target.value)}
              />
            </div>
          </section>

          {error && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              {error}
            </p>
          )}

          {saved && (
            <p className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400">
              <Check className="size-4" />
              Configurações salvas. As metas de calorias e macros foram recalculadas.
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" variant="brand" loading={saving}>
              <Save className="size-4" />
              Salvar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
