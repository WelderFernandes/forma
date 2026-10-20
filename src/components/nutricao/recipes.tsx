"use client";

import * as React from "react";
import { ChefHat, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { DietBadge } from "@/components/nutricao/meal-plans";
import { MEAL_LABELS, type Meal } from "@/lib/domain/types";
import { formatNumber } from "@/lib/utils";
import type { RecipeDTO } from "@/components/nutricao/types";

export function Recipes({ recipes }: { recipes: RecipeDTO[] }) {
  if (recipes.length === 0) {
    return (
      <EmptyState
        icon={ChefHat}
        title="Nenhuma receita disponível"
        description="As receitas do sistema aparecem aqui assim que o banco de dados for populado."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <Card key={recipe.id} className="flex flex-col">
          <CardHeader className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{recipe.title}</CardTitle>
              <DietBadge diet={recipe.diet} />
            </div>
            <CardDescription>{recipe.description}</CardDescription>
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px]">
                <Clock className="size-3" />
                {recipe.prepMinutes} min
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                <Users className="size-3" />
                {recipe.servings} porções
              </Badge>
              <Badge variant="brand" className="text-[10px]">
                {formatNumber(recipe.calories)} kcal
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge variant="outline" className="text-[10px]">
                P {formatNumber(recipe.protein, 1)} g
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                C {formatNumber(recipe.carbs, 1)} g
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                G {formatNumber(recipe.fat, 1)} g
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="mt-auto flex-1">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  Ver receita
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>{recipe.title}</DialogTitle>
                  <DialogDescription>
                    {recipe.description} · {recipe.prepMinutes} min de preparo
                  </DialogDescription>
                </DialogHeader>

                <section className="space-y-2">
                  <h4 className="text-sm font-semibold">Ingredientes</h4>
                  <ul className="space-y-1.5">
                    {(recipe.ingredients ?? []).map((ingredient, index) => (
                      <li
                        key={`${recipe.id}-ing-${index}`}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="space-y-2">
                  <h4 className="text-sm font-semibold">Modo de preparo</h4>
                  <ol className="space-y-2">
                    {(recipe.steps ?? []).map((step, index) => (
                      <li
                        key={`${recipe.id}-step-${index}`}
                        className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3 text-sm"
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-semibold text-brand">
                          {index + 1}
                        </span>
                        <span className="text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                </section>

                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline">
                    {MEAL_LABELS[recipe.meal as Meal] ?? recipe.meal}
                  </Badge>
                  {(recipe.tags ?? []).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px] capitalize">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
