"use client";

import * as React from "react";
import { Plus, Trash2, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/primitives";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addMealEntry, deleteMealEntry } from "@/server/actions/nutrition";
import { MEALS, MEAL_LABELS, type Meal } from "@/lib/domain/types";
import { formatNumber } from "@/lib/utils";
import type { FoodDTO, MealEntryDTO } from "@/components/nutricao/types";

const CATEGORY_LABELS: Record<string, string> = {
  carboidrato: "Carboidratos",
  proteina: "Proteínas",
  gordura: "Gorduras",
  fruta: "Frutas",
  vegetal: "Vegetais",
  laticinio: "Laticínios",
  bebida: "Bebidas",
  industrializado: "Industrializados",
  supplement: "Suplementos",
};

const CATEGORY_ORDER = [
  "proteina",
  "carboidrato",
  "vegetal",
  "fruta",
  "laticinio",
  "gordura",
  "bebida",
  "industrializado",
  "supplement",
];

const MANUAL_OPTION = "manual";

export function MealLog({ meals, foods }: { meals: MealEntryDTO[]; foods: FoodDTO[] }) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [meal, setMeal] = React.useState<Meal>("breakfast");
  const [foodId, setFoodId] = React.useState<string>(MANUAL_OPTION);
  const [servings, setServings] = React.useState("1");
  const [name, setName] = React.useState("");
  const [calories, setCalories] = React.useState("");
  const [protein, setProtein] = React.useState("");
  const [carbs, setCarbs] = React.useState("");
  const [fat, setFat] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const [saving, startSave] = React.useTransition();
  const [removing, startRemove] = React.useTransition();

  const selectedFood = foods.find((food) => food.id === foodId) ?? null;

  // Agrupa o catálogo por categoria para o seletor de alimentos.
  const groupedFoods = React.useMemo(() => {
    const map = new Map<string, FoodDTO[]>();
    for (const food of foods) {
      const list = map.get(food.category) ?? [];
      list.push(food);
      map.set(food.category, list);
    }
    return Array.from(map.entries()).sort(
      (a, b) => CATEGORY_ORDER.indexOf(a[0]) - CATEGORY_ORDER.indexOf(b[0]),
    );
  }, [foods]);

  function resetForm() {
    setMeal("breakfast");
    setFoodId(MANUAL_OPTION);
    setServings("1");
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const multiplier = Math.max(0.1, Number(servings) || 1);

    let payload: {
      meal: Meal;
      name: string;
      serving?: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };

    if (selectedFood) {
      payload = {
        meal,
        name: selectedFood.name,
        serving:
          multiplier === 1
            ? selectedFood.serving
            : `${selectedFood.serving} x${formatNumber(multiplier, 1)}`,
        calories: Math.round(selectedFood.calories * multiplier),
        protein: Math.round(selectedFood.protein * multiplier * 10) / 10,
        carbs: Math.round(selectedFood.carbs * multiplier * 10) / 10,
        fat: Math.round(selectedFood.fat * multiplier * 10) / 10,
      };
    } else {
      const parsedCalories = Number(calories);
      if (!name.trim()) {
        setError("Informe o nome do alimento.");
        return;
      }
      if (!Number.isFinite(parsedCalories) || parsedCalories < 0) {
        setError("Informe as calorias do item.");
        return;
      }
      payload = {
        meal,
        name: name.trim(),
        calories: Math.round(parsedCalories),
        protein: Math.max(0, Number(protein) || 0),
        carbs: Math.max(0, Number(carbs) || 0),
        fat: Math.max(0, Number(fat) || 0),
      };
    }

    startSave(async () => {
      await addMealEntry(payload);
      setDialogOpen(false);
      resetForm();
    });
  }

  function handleDelete(id: string) {
    startRemove(async () => {
      await deleteMealEntry(id);
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle>Diário de refeições</CardTitle>
          <CardDescription>Tudo o que você comeu hoje, por refeição</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="brand" size="sm" className="shrink-0">
              <Plus className="size-4" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Adicionar item</DialogTitle>
              <DialogDescription>
                Escolha um alimento do catálogo ou escreva os valores manualmente.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="refeicao">Refeição</Label>
                  <Select value={meal} onValueChange={(value) => setMeal(value as Meal)}>
                    <SelectTrigger id="refeicao">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEALS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {MEAL_LABELS[option]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="alimento">Alimento</Label>
                  <Select value={foodId} onValueChange={setFoodId}>
                    <SelectTrigger id="alimento">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={MANUAL_OPTION}>Digitar manualmente</SelectItem>
                      {groupedFoods.map(([category, list]) => (
                        <SelectGroup key={category}>
                          <SelectLabel>{CATEGORY_LABELS[category] ?? category}</SelectLabel>
                          {list.map((food) => (
                            <SelectItem key={food.id} value={food.id}>
                              {food.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedFood ? (
                <div className="space-y-3 rounded-xl border border-border bg-surface p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{selectedFood.name}</span>
                    <span className="text-xs text-muted-foreground">{selectedFood.serving}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-background p-2">
                      <p className="font-semibold tabular-nums">{selectedFood.calories}</p>
                      <p className="text-muted-foreground">kcal</p>
                    </div>
                    <div className="rounded-lg bg-background p-2">
                      <p className="font-semibold tabular-nums">{selectedFood.protein} g</p>
                      <p className="text-muted-foreground">proteína</p>
                    </div>
                    <div className="rounded-lg bg-background p-2">
                      <p className="font-semibold tabular-nums">{selectedFood.carbs} g</p>
                      <p className="text-muted-foreground">carboidrato</p>
                    </div>
                    <div className="rounded-lg bg-background p-2">
                      <p className="font-semibold tabular-nums">{selectedFood.fat} g</p>
                      <p className="text-muted-foreground">gordura</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="porcoes">Quantidade de porções</Label>
                    <Input
                      id="porcoes"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={servings}
                      onChange={(event) => setServings(event.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border border-border bg-surface p-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="nome">Nome do item</Label>
                    <Input
                      id="nome"
                      value={name}
                      maxLength={120}
                      placeholder="Ex.: Sanduíche natural"
                      onChange={(event) => setName(event.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="calorias">Calorias</Label>
                      <Input
                        id="calorias"
                        type="number"
                        min="0"
                        value={calories}
                        placeholder="0"
                        onChange={(event) => setCalories(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="proteina">Proteína (g)</Label>
                      <Input
                        id="proteina"
                        type="number"
                        min="0"
                        step="0.1"
                        value={protein}
                        placeholder="0"
                        onChange={(event) => setProtein(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="carboidratos">Carboidrato (g)</Label>
                      <Input
                        id="carboidratos"
                        type="number"
                        min="0"
                        step="0.1"
                        value={carbs}
                        placeholder="0"
                        onChange={(event) => setCarbs(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="gordura">Gordura (g)</Label>
                      <Input
                        id="gordura"
                        type="number"
                        min="0"
                        step="0.1"
                        value={fat}
                        placeholder="0"
                        onChange={(event) => setFat(event.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="brand" loading={saving}>
                  Salvar item
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-4">
        {meals.length === 0 ? (
          <EmptyState
            icon={Utensils}
            title="Nenhuma refeição registrada hoje"
            description="Use o botão Adicionar para registrar o primeiro item do dia."
          />
        ) : (
          MEALS.map((mealKey) => {
            const items = meals.filter((entry) => entry.meal === mealKey);
            const totalCalories = items.reduce((acc, entry) => acc + entry.calories, 0);
            return (
              <section key={mealKey} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{MEAL_LABELS[mealKey]}</h3>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {items.length > 0 ? `${formatNumber(totalCalories)} kcal` : "sem registro"}
                  </span>
                </div>

                {items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
                    Nada registrado em {MEAL_LABELS[mealKey].toLowerCase()}.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {items.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{entry.name}</p>
                          {entry.serving && (
                            <p className="truncate text-xs text-muted-foreground">{entry.serving}</p>
                          )}
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <Badge variant="outline" className="text-[10px]">
                              {formatNumber(entry.calories)} kcal
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              P {formatNumber(entry.protein, 1)} g
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              C {formatNumber(entry.carbs, 1)} g
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              G {formatNumber(entry.fat, 1)} g
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remover ${entry.name}`}
                          disabled={removing}
                          onClick={() => handleDelete(entry.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
