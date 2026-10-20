"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/primitives";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { saveTemplate } from "@/server/actions/workouts";
import {
  EQUIPMENT,
  EQUIPMENT_LABELS,
  GOALS,
  GOAL_LABELS,
  LEVELS,
  LEVEL_LABELS,
  MUSCLE_LABELS,
  SPLITS,
  SPLIT_LABELS,
  type Equipment,
} from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export type EditorExercise = {
  id: string;
  slug: string;
  name: string;
  primaryMuscle: string;
  equipment: string;
  category: string;
  difficulty: string;
};

export type EditorItem = {
  exerciseId: string;
  exerciseName: string;
  slug: string;
  sets: number;
  reps: string;
  restSeconds: number;
  rpe: string;
  tempo: string;
  notes: string;
  supersetGroup: string;
};

export function TemplateEditor({
  exercises,
  initial,
}: {
  exercises: EditorExercise[];
  initial?: {
    id: string;
    name: string;
    description: string;
    split: string;
    goal: string;
    level: string;
    equipment: string[];
    daysPerWeek: number;
    estMinutes: number;
    tags: string[];
    items: EditorItem[];
  };
}) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const [name, setName] = React.useState(initial?.name ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [split, setSplit] = React.useState(initial?.split ?? "full_body");
  const [goal, setGoal] = React.useState(initial?.goal ?? "");
  const [level, setLevel] = React.useState(initial?.level ?? "beginner");
  const [equipment, setEquipment] = React.useState<string[]>(
    initial?.equipment ?? ["none"],
  );
  const [daysPerWeek, setDaysPerWeek] = React.useState(
    initial?.daysPerWeek ?? 3,
  );
  const [estMinutes, setEstMinutes] = React.useState(initial?.estMinutes ?? 35);
  const [items, setItems] = React.useState<EditorItem[]>(initial?.items ?? []);

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    const base = term
      ? exercises.filter(
          (ex) =>
            ex.name.toLowerCase().includes(term) ||
            (MUSCLE_LABELS[ex.primaryMuscle] ?? "")
              .toLowerCase()
              .includes(term) ||
            ex.equipment.toLowerCase().includes(term),
        )
      : exercises;
    return base.slice(0, 80);
  }, [exercises, search]);

  function addExercise(exercise: EditorExercise) {
    if (items.some((item) => item.exerciseId === exercise.id)) {
      toast.info("Esse exercício já está na ficha");
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        slug: exercise.slug,
        sets: 3,
        reps: "12",
        restSeconds: 60,
        rpe: "",
        tempo: "",
        notes: "",
        supersetGroup: "",
      },
    ]);
    setPickerOpen(false);
    setSearch("");
  }

  function updateItem(index: number, patch: Partial<EditorItem>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleEquipment(value: string) {
    setEquipment((prev) => {
      if (value === "none") {
        return prev.includes("none") ? [] : ["none"];
      }
      const next = prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev.filter((item) => item !== "none"), value];
      return next;
    });
  }

  async function handleSave() {
    if (name.trim().length < 2) {
      toast.error("Dê um nome à ficha");
      return;
    }
    if (items.length === 0) {
      toast.error("Adicione pelo menos um exercício");
      return;
    }

    setSaving(true);
    try {
      await saveTemplate({
        id: initial?.id,
        name: name.trim(),
        description: description.trim() || null,
        split,
        goal: goal || null,
        level,
        equipment,
        daysPerWeek,
        estMinutes,
        tags: [split],
        items: items.map((item) => ({
          exerciseId: item.exerciseId,
          sets: item.sets,
          reps: item.reps,
          restSeconds: item.restSeconds,
          rpe: item.rpe ? Number(item.rpe) : null,
          tempo: item.tempo.trim() || null,
          notes: item.notes.trim() || null,
          supersetGroup: item.supersetGroup.trim() || null,
        })),
      });
      toast.success("Ficha salva");
      router.push("/treinos");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Dados básicos */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da ficha</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Peito e tríceps"
              maxLength={80}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Para que serve, quando usar, o que observar…"
              maxLength={600}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Divisão</Label>
            <Select value={split} onValueChange={setSplit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPLITS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {SPLIT_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Objetivo</Label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger>
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

          <div className="space-y-2">
            <Label>Nível</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {LEVEL_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="days">Dias/semana</Label>
              <Input
                id="days"
                type="number"
                min={1}
                max={7}
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minutes">Duração (min)</Label>
              <Input
                id="minutes"
                type="number"
                min={5}
                max={240}
                value={estMinutes}
                onChange={(e) => setEstMinutes(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Equipamento</Label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleEquipment(option)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    equipment.includes(option)
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {EQUIPMENT_LABELS[option as Equipment]}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercícios */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Exercícios</CardTitle>
            <p className="text-sm text-muted-foreground">
              {items.length === 0
                ? "Adicione os exercícios da ficha"
                : `${items.length} exercício${items.length > 1 ? "s" : ""} · ${items.reduce((acc, i) => acc + i.sets, 0)} séries no total`}
            </p>
          </div>
          <Button variant="brand" size="sm" onClick={() => setPickerOpen(true)}>
            <Plus className="size-4" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center transition-colors hover:border-brand/40 hover:bg-secondary/40"
            >
              <Plus className="size-5 text-muted-foreground" />
              <p className="text-sm font-medium">Adicionar o primeiro exercício</p>
              <p className="text-xs text-muted-foreground">
                Escolha na biblioteca com {exercises.length} opções
              </p>
            </button>
          ) : (
            <ul className="space-y-3">
              {items.map((item, index) => (
                <li
                  key={item.exerciseId}
                  className="rounded-xl border border-border bg-surface p-3.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-semibold tabular-nums">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {item.exerciseName}
                    </span>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => moveItem(index, -1)}
                        disabled={index === 0}
                        aria-label="Mover para cima"
                      >
                        <ChevronUp className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => moveItem(index, 1)}
                        disabled={index === items.length - 1}
                        aria-label="Mover para baixo"
                      >
                        <ChevronDown className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeItem(index)}
                        aria-label="Remover"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">
                        Séries
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        className="h-9"
                        value={item.sets}
                        onChange={(e) =>
                          updateItem(index, { sets: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">
                        Repetições
                      </Label>
                      <Input
                        className="h-9"
                        value={item.reps}
                        onChange={(e) =>
                          updateItem(index, { reps: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">
                        Descanso (s)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={900}
                        className="h-9"
                        value={item.restSeconds}
                        onChange={(e) =>
                          updateItem(index, { restSeconds: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">RPE</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        placeholder="—"
                        className="h-9"
                        value={item.rpe}
                        onChange={(e) =>
                          updateItem(index, { rpe: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">
                        Cadência
                      </Label>
                      <Input
                        placeholder="3-1-1"
                        className="h-9"
                        value={item.tempo}
                        onChange={(e) =>
                          updateItem(index, { tempo: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="Observação para o treino (ex.: não descer além de 90°)"
                      className="h-9 text-xs"
                      value={item.notes}
                      onChange={(e) =>
                        updateItem(index, { notes: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Supersérie (mesmo grupo = alternado)"
                      className="h-9 text-xs"
                      value={item.supersetGroup}
                      onChange={(e) =>
                        updateItem(index, { supersetGroup: e.target.value })
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button variant="brand" onClick={handleSave} loading={saving}>
          {!saving && <Save className="size-4" />}
          Salvar ficha
        </Button>
      </div>

      {/* Picker */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Adicionar exercício</DialogTitle>
            <DialogDescription>
              Busque por nome, grupo muscular ou equipamento.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar exercício…"
              className="pl-9"
            />
          </div>

          <ul className="max-h-[50vh] space-y-1 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="py-8 text-center text-sm text-muted-foreground">
                Nenhum exercício encontrado.
              </li>
            )}
            {filtered.map((exercise) => {
              const already = items.some((i) => i.exerciseId === exercise.id);
              return (
                <li key={exercise.id}>
                  <button
                    type="button"
                    onClick={() => addExercise(exercise)}
                    disabled={already}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors",
                      already
                        ? "cursor-not-allowed opacity-40"
                        : "hover:bg-secondary",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {exercise.name}
                      </span>
                      <span className="mt-0.5 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[10px]">
                          {MUSCLE_LABELS[exercise.primaryMuscle] ??
                            exercise.primaryMuscle}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {EQUIPMENT_LABELS[
                            exercise.equipment as Equipment
                          ] ?? exercise.equipment}
                        </Badge>
                      </span>
                    </span>
                    {already ? (
                      <span className="text-xs text-muted-foreground">Adicionado</span>
                    ) : (
                      <Plus className="size-4 shrink-0 text-brand" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <Button variant="outline" onClick={() => setPickerOpen(false)}>
            <X className="size-4" />
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
