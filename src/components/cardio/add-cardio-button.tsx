"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Activity,
  Bike,
  CalendarDays,
  Clock,
  Footprints,
  MapPin,
  Mountain,
  Plus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Label, Switch } from "@/components/ui/primitives";
import {
  CARDIO_ACTIVITIES,
  CARDIO_ACTIVITY_META,
  CARDIO_INTENSITIES,
  CARDIO_INTENSITY_LABELS,
  estimateCardioCalories,
  type CardioActivity,
  type CardioIntensity,
} from "@/lib/domain/cardio";
import { cn, dayKey, formatDate } from "@/lib/utils";
import { addCardio } from "@/server/actions/cardio";

const ACTIVITY_ICONS = {
  walk: Footprints,
  run: Activity,
  hike: Mountain,
  cycle: Bike,
  other: MapPin,
} as const;

const QUICK_MINUTES = [20, 30, 45, 60];

export function AddCardioButton({
  defaultDate,
  weightKg,
  label = "Adicionar cardio",
  variant = "brand",
  size = "default",
  compact = false,
  className,
}: {
  defaultDate: string;
  weightKg?: number | null;
  label?: string;
  variant?: "brand" | "outline" | "ghost" | "secondary";
  size?: "sm" | "default" | "lg" | "icon-sm";
  compact?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState(defaultDate);
  const [activity, setActivity] = React.useState<CardioActivity>("walk");
  const [duration, setDuration] = React.useState("30");
  const [intensity, setIntensity] =
    React.useState<CardioIntensity>("moderate");
  const [distance, setDistance] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [completed, setCompleted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setDate(defaultDate);
      setActivity("walk");
      setDuration("30");
      setIntensity("moderate");
      setDistance("");
      setNotes("");
      setCompleted(defaultDate < dayKey());
      setError(null);
    }
  }

  function handleDateChange(value: string) {
    setDate(value);
    setCompleted(Boolean(value) && value < dayKey());
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const minutes = Math.round(Number(duration));
    const km = distance ? Number(distance.replace(",", ".")) : null;

    if (!date) {
      setError("Escolha uma data para o cardio.");
      return;
    }
    if (!Number.isFinite(minutes) || minutes < 5 || minutes > 300) {
      setError("A duração precisa estar entre 5 e 300 minutos.");
      return;
    }
    if (km !== null && (!Number.isFinite(km) || km < 0 || km > 500)) {
      setError("A distância precisa estar entre 0 e 500 km.");
      return;
    }

    setSaving(true);
    try {
      await addCardio({
        date,
        activity,
        durationMinutes: minutes,
        intensity,
        distanceKm: km,
        notes: notes.trim() || null,
        completed,
      });
      toast.success(
        completed
          ? "Cardio registrado no seu histórico."
          : "Cardio adicionado à sua agenda.",
      );
      setOpen(false);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível adicionar o cardio agora.",
      );
    } finally {
      setSaving(false);
    }
  }

  const meta = CARDIO_ACTIVITY_META[activity];
  const estimate = estimateCardioCalories({
    activity,
    intensity,
    minutes: Number(duration) || 0,
    weightKg,
  });

  const trigger = compact ? (
    <Button
      type="button"
      variant={variant}
      size="icon-sm"
      className={cn("shrink-0", className)}
      aria-label={`Adicionar cardio em ${formatDate(`${defaultDate}T12:00:00`, {
        weekday: "long",
        day: "2-digit",
        month: "long",
      })}`}
      title={label}
      onClick={() => handleOpenChange(true)}
    >
      <Plus className="size-4" />
    </Button>
  ) : (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() => handleOpenChange(true)}
    >
      <Plus className="size-4" />
      {label}
    </Button>
  );

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <p className="eyebrow text-clay">Movimento ao ar livre</p>
            <DialogTitle>Adicionar cardio</DialogTitle>
            <DialogDescription>
              Planeje uma caminhada, corrida, trilha ou pedal. Pode ser em um
              dia de treino ou em um dia livre.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <fieldset className="space-y-2.5">
              <legend className="text-[13px] font-medium">Atividade</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CARDIO_ACTIVITIES.map((value) => {
                  const Icon = ACTIVITY_ICONS[value];
                  const isActive = activity === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setActivity(value)}
                      aria-pressed={isActive}
                      className={cn(
                        "flex min-h-[72px] flex-col items-start rounded-2xl border p-3 text-left transition-colors",
                        isActive
                          ? "border-clay bg-clay/10 text-foreground"
                          : "border-border bg-surface/60 text-muted hover:border-foreground/20 hover:text-foreground",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4",
                          isActive ? "text-clay" : "text-muted",
                        )}
                        strokeWidth={1.8}
                      />
                      <span className="mt-2 text-[12.5px] font-semibold">
                        {CARDIO_ACTIVITY_META[value].label}
                      </span>
                      <span className="mt-0.5 line-clamp-1 text-[10px] leading-relaxed opacity-65">
                        {CARDIO_ACTIVITY_META[value].body}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cardio-data">Data</Label>
                <Input
                  id="cardio-data"
                  type="date"
                  value={date}
                  onChange={(event) => handleDateChange(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cardio-duracao">Duração (min)</Label>
                <Input
                  id="cardio-duracao"
                  type="number"
                  min="5"
                  max="300"
                  step="5"
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {QUICK_MINUTES.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setDuration(String(minutes))}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
                    Number(duration) === minutes
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted hover:bg-surface",
                  )}
                >
                  {minutes} min
                </button>
              ))}
            </div>

            <fieldset className="space-y-2">
              <legend className="text-[13px] font-medium">Intensidade</legend>
              <div className="grid grid-cols-3 gap-1.5 rounded-full border border-border-soft bg-surface p-1">
                {CARDIO_INTENSITIES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setIntensity(value)}
                    aria-pressed={intensity === value}
                    className={cn(
                      "rounded-full px-2 py-2 text-[11.5px] font-medium transition-colors",
                      intensity === value
                        ? "bg-foreground text-background"
                        : "text-muted hover:text-foreground",
                    )}
                  >
                    {CARDIO_INTENSITY_LABELS[value]}
                  </button>
                ))}
              </div>
            </fieldset>

            {meta.distanceLabel && (
              <div className="space-y-1.5">
                <Label htmlFor="cardio-distancia">
                  {meta.distanceLabel} (km){" "}
                  <span className="font-normal text-muted">— opcional</span>
                </Label>
                <Input
                  id="cardio-distancia"
                  type="number"
                  min="0"
                  max="500"
                  step="0.1"
                  inputMode="decimal"
                  placeholder="Ex.: 4,2"
                  value={distance}
                  onChange={(event) => setDistance(event.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="cardio-notas">
                Notas <span className="font-normal text-muted">— opcional</span>
              </Label>
              <Textarea
                id="cardio-notas"
                value={notes}
                maxLength={400}
                placeholder="Como você quer se sentir depois? Algum percurso ou detalhe?"
                onChange={(event) => setNotes(event.target.value)}
                className="min-h-20"
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface/70 p-3.5">
              <div>
                <p className="text-[13px] font-medium">
                  {completed ? "Já fiz este cardio" : "Quero planejar"}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                  {completed
                    ? "Vai direto para o histórico como concluído."
                    : "Vai aparecer na sua agenda para você concluir depois."}
                </p>
              </div>
              <Switch
                checked={completed}
                onCheckedChange={setCompleted}
                aria-label="Marcar cardio como concluído"
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-2xl bg-brand-soft px-4 py-3 text-[11.5px] text-brand">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Sparkles className="size-3.5" />~{estimate} kcal
              </span>
              <span className="inline-flex items-center gap-1.5 text-brand/75">
                <Clock className="size-3.5" />
                {Number(duration) || 0} min ·{" "}
                {CARDIO_INTENSITY_LABELS[intensity].toLowerCase()}
              </span>
              <span className="inline-flex items-center gap-1.5 text-brand/75">
                <CalendarDays className="size-3.5" />
                {date ? formatDate(`${date}T12:00:00`, { day: "2-digit", month: "short" }) : "—"}
              </span>
            </div>

            <p className="text-[10.5px] leading-relaxed text-muted">
              Gasto calórico é uma estimativa de referência, não uma meta para
              compensar a alimentação.
            </p>

            {error && (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                {error}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="brand" loading={saving}>
                {completed ? "Registrar cardio" : "Adicionar à agenda"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
