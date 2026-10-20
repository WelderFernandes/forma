import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Dumbbell,
  Info,
  Layers,
  Link2,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StartWorkoutButton } from "@/components/start-workout-button";
import { TemplateActions } from "@/components/template-actions";
import { getCurrentUser } from "@/server/auth-helpers";
import { getTemplates } from "@/server/queries";
import {
  EQUIPMENT_LABELS,
  LEVEL_LABELS,
  MUSCLE_LABELS,
  SPLIT_LABELS,
  type Level,
  type Split,
} from "@/lib/domain/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return { title: "Ficha" };
  const templates = await getTemplates(user.id);
  const template = templates.find((t) => t.id === id);
  return { title: template?.name ?? "Ficha de treino" };
}

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const templates = await getTemplates(user.id);
  const template = templates.find((t) => t.id === id);
  if (!template) notFound();

  const editable = !template.isSystem && template.userId === user.id;

  // Agrupa superséries
  const groups = template.items.reduce<
    Record<string, typeof template.items>
  >((acc, item) => {
    const key = item.supersetGroup ?? "__solo__";
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <Link
        href="/treinos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para treinos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="eyebrow text-muted">Sua ficha</p>
          <h1 className="font-display text-[clamp(2rem,4vw,3.1rem)] leading-[0.98] tracking-[-0.02em]">
            {template.name}
          </h1>
          {template.description && (
            <p className="max-w-2xl text-[13.5px] leading-relaxed text-muted">
              {template.description}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge variant="outline">
              <Layers className="size-3" />
              {SPLIT_LABELS[template.split as Split] ?? template.split}
            </Badge>
            <Badge variant="outline">
              <Dumbbell className="size-3" />
              {template.items.length} exercícios
            </Badge>
            <Badge variant="outline">
              <Timer className="size-3" />
              {template.estMinutes} min
            </Badge>
            {template.daysPerWeek && (
              <Badge variant="outline">
                <CalendarDays className="size-3" />
                {template.daysPerWeek}x por semana
              </Badge>
            )}
            {template.level && (
              <Badge variant="outline">
                {LEVEL_LABELS[template.level as Level] ?? template.level}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <TemplateActions templateId={template.id} editable={editable} />
          <StartWorkoutButton
            templateId={template.id}
            label="Iniciar treino"
            size="lg"
            className="flex-1 sm:flex-none"
          />
        </div>
      </div>

      {template.equipment.length > 0 && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-2 p-4">
            <span className="text-xs font-medium text-muted-foreground">
              Equipamento necessário:
            </span>
            {template.equipment.map((eq) => (
              <Badge key={eq} variant="default">
                {EQUIPMENT_LABELS[eq as keyof typeof EQUIPMENT_LABELS] ?? eq}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Exercícios</CardTitle>
          <p className="text-sm text-muted-foreground">
            Toque no nome do exercício para ver o passo a passo e as dicas de
            execução.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="space-y-2">
              {group !== "__solo__" && (
                <div className="flex items-center gap-2">
                  <Badge variant="accent">Supersérie</Badge>
                  <span className="h-px flex-1 bg-border" />
                </div>
              )}
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {items.map((item) => (
                  <li key={item.id} className="p-4">
                    <div className="flex flex-wrap items-start gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.045] text-xs font-semibold tabular-nums">
                        {item.order + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/exercicios/${item.exercise.slug}`}
                          className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-brand"
                        >
                          {item.exercise.name}
                          <Link2 className="size-3 opacity-50" />
                        </Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {MUSCLE_LABELS[item.exercise.primaryMuscle] ??
                            item.exercise.primaryMuscle}{" "}
                          ·{" "}
                          {EQUIPMENT_LABELS[
                            item.exercise.equipment as keyof typeof EQUIPMENT_LABELS
                          ] ?? item.exercise.equipment}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="default">
                          {item.sets} × {item.reps}
                        </Badge>
                        <Badge variant="outline">
                          <Clock className="size-3" />
                          {item.restSeconds}s
                        </Badge>
                        {item.rpe && (
                          <Badge variant="outline">RPE {item.rpe}</Badge>
                        )}
                        {item.tempo && (
                          <Badge variant="outline">cadência {item.tempo}</Badge>
                        )}
                      </div>
                    </div>

                    {item.notes && (
                      <p className="mt-2.5 flex items-start gap-2 rounded-xl bg-surface p-2.5 text-xs text-muted">
                        <Info className="mt-0.5 size-3.5 shrink-0" />
                        {item.notes}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
