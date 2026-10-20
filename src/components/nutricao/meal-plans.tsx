"use client";

import * as React from "react";
import { BookOpen, Utensils } from "lucide-react";
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
import { formatNumber } from "@/lib/utils";
import type { MealPlanDTO } from "@/components/nutricao/types";

/** Etiqueta com o estilo do plano alimentar (keto, low carb, etc.). */
export function DietBadge({ diet }: { diet: string }) {
  return (
    <Badge variant="outline" className="text-[10px] capitalize">
      {diet}
    </Badge>
  );
}

export function MealPlans({ plans }: { plans: MealPlanDTO[] }) {
  if (plans.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Nenhum plano alimentar disponível"
        description="Os planos do sistema aparecem aqui assim que o banco de dados for populado."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {plans.map((plan) => (
        <Card key={plan.id} className="flex flex-col">
          <CardHeader className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{plan.title}</CardTitle>
              <DietBadge diet={plan.diet} />
            </div>
            <CardDescription>{plan.subtitle}</CardDescription>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge variant="brand" className="text-[10px]">
                {formatNumber(plan.calories)} kcal
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                P {formatNumber(plan.protein)} g
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                C {formatNumber(plan.carbs)} g
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                G {formatNumber(plan.fat)} g
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="mt-auto flex-1 space-y-3">
            <p className="text-sm text-muted-foreground">{plan.description}</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Utensils className="size-4" />
                  Ver refeições do dia
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>{plan.title}</DialogTitle>
                  <DialogDescription>
                    {plan.subtitle} · {formatNumber(plan.calories)} kcal no dia
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  {plan.meals.map((meal, index) => (
                    <section
                      key={`${plan.id}-${index}`}
                      className="rounded-xl border border-border bg-surface p-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">{meal.name}</h4>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {formatNumber(meal.calories)} kcal
                        </span>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {(meal.items ?? []).map((item, itemIndex) => (
                          <li
                            key={`${plan.id}-${index}-${itemIndex}`}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <span className="size-1.5 rounded-full bg-brand" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>

                {plan.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {plan.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px] capitalize">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
