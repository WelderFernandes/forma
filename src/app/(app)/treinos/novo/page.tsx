import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TemplateEditor, type EditorItem } from "@/components/template-editor";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/server/auth-helpers";
import { getExercises, getTemplates } from "@/server/queries";

export const metadata: Metadata = {
  title: "Nova ficha",
};

export default async function NewTemplatePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template: templateId } = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;

  const [exercises, templates] = await Promise.all([
    getExercises(),
    templateId ? getTemplates(user.id) : Promise.resolve([]),
  ]);

  const existing = templateId
    ? templates.find((t) => t.id === templateId && t.userId === user.id)
    : undefined;

  const initial = existing
    ? {
        id: existing.id,
        name: existing.name,
        description: existing.description ?? "",
        split: existing.split,
        goal: existing.goal ?? "",
        level: existing.level ?? "beginner",
        equipment: existing.equipment,
        daysPerWeek: existing.daysPerWeek ?? 3,
        estMinutes: existing.estMinutes,
        tags: existing.tags,
        items: existing.items.map(
          (item): EditorItem => ({
            exerciseId: item.exerciseId,
            exerciseName: item.exercise.name,
            slug: item.exercise.slug,
            sets: item.sets,
            reps: item.reps,
            restSeconds: item.restSeconds,
            rpe: item.rpe ? String(item.rpe) : "",
            tempo: item.tempo ?? "",
            notes: item.notes ?? "",
            supersetGroup: item.supersetGroup ?? "",
          }),
        ),
      }
    : undefined;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Link
        href="/treinos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para treinos
      </Link>

      <PageHeader
        eyebrow={existing ? "Ajustar ficha" : "Montar do zero"}
        title={existing ? "Editar ficha" : "Nova ficha de treino"}
        description="Monte a ficha exercício por exercício, com séries, descanso, RPE e cadência de execução."
      />

      <TemplateEditor
        exercises={exercises.map((ex) => ({
          id: ex.id,
          slug: ex.slug,
          name: ex.name,
          primaryMuscle: ex.primaryMuscle,
          equipment: ex.equipment,
          category: ex.category,
          difficulty: ex.difficulty,
        }))}
        initial={initial}
      />
    </div>
  );
}
