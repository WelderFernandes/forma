import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  Dumbbell,
  Footprints,
  History,
  Layers,
  Plus,
  Sparkles,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StartWorkoutButton } from "@/components/start-workout-button";
import { getCurrentUser } from "@/server/auth-helpers";
import { getProfile, getSessions, getTemplates } from "@/server/queries";
import { EQUIPMENT_LABELS, SPLIT_LABELS, type Split } from "@/lib/domain/types";
import {
  WEEKDAYS,
  formatTrainingDays,
  normalizeTrainingDays,
} from "@/lib/domain/schedule";
import { formatDate, formatDuration } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Treinos",
};

export default async function WorkoutsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [templates, sessions, profile] = await Promise.all([
    getTemplates(user.id),
    getSessions(user.id, 40),
    getProfile(user.id),
  ]);

  const mine = templates.filter((t) => !t.isSystem);
  const system = templates.filter((t) => t.isSystem);
  const completed = sessions.filter((s) => s.status === "completed");
  const trainingDays = normalizeTrainingDays(
    profile?.trainingDays,
    profile?.daysPerWeek ?? 3,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Seu plano de treino"
        title="Treinos"
        description={
          mine.length > 0
            ? `${mine.length} ${mine.length === 1 ? "ficha sua" : "fichas suas"} e ${system.length} modelos prontos para explorar.`
            : "Modelos prontos para começar — ou monte a sua própria ficha."
        }
        actions={
          <Button asChild variant="brand">
            <Link href="/treinos/novo">
              <Plus className="size-4" />
              Nova ficha
            </Link>
          </Button>
        }
      />

      <Card hoverable={false} className="bg-surface/55">
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
              <CalendarDays className="size-4" />
            </span>
            <div>
              <p className="eyebrow text-muted">Sua agenda</p>
              <p className="mt-1 text-[13px] font-medium">
                {trainingDays.length}x por semana ·{" "}
                {formatTrainingDays(trainingDays)}
              </p>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => {
              const active = trainingDays.includes(day.value);
              return (
                <div
                  key={day.value}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border py-2 ${
                    active
                      ? "border-brand/30 bg-brand-soft/50 text-brand"
                      : "border-border-soft bg-surface/45 text-muted"
                  }`}
                  title={`${day.full}: ${active ? "treino" : "descanso"}`}
                >
                  <span className="text-[8.5px] font-semibold uppercase tracking-[0.06em]">
                    {day.short}
                  </span>
                  <span
                    className={`size-1.5 rounded-full ${
                      active ? "bg-brand" : "bg-foreground/15"
                    }`}
                  />
                </div>
              );
            })}
          </div>

          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/cardio">
              <Footprints className="size-3.5" />
              Cardio nos dias livres
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue={mine.length > 0 ? "minhas" : "modelos"}>
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="minhas">
            <Layers className="size-4" />
            Minhas fichas
          </TabsTrigger>
          <TabsTrigger value="modelos">
            <Sparkles className="size-4" />
            Modelos
          </TabsTrigger>
          <TabsTrigger value="historico">
            <History className="size-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="minhas">
          {mine.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="Você ainda não tem fichas"
              description="Responda o questionário para receber um plano montado, ou monte o seu exercício por exercício."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild variant="brand" size="sm">
                    <Link href="/treinos/novo">Criar ficha</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/treinos">Ver modelos</Link>
                  </Button>
                </div>
              }
            />
          ) : (
            <TemplateGrid templates={mine} />
          )}
        </TabsContent>

        <TabsContent value="modelos">
          <TemplateGrid templates={system} />
        </TabsContent>

        <TabsContent value="historico">
          {completed.length === 0 ? (
            <EmptyState
              icon={History}
              title="Nenhum treino registrado"
              description="Assim que você concluir um treino, ele aparece aqui com volume, duração e recordes."
            />
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {completed.map((session) => {
                const totalVolume = session.items.reduce(
                  (acc, item) =>
                    acc +
                    item.sets.reduce(
                      (b, set) =>
                        b + (set.completed ? (set.weightKg ?? 0) * (set.reps ?? 0) : 0),
                      0,
                    ),
                  0,
                );
                const prs = session.items.reduce(
                  (acc, item) => acc + item.sets.filter((s) => s.isPr).length,
                  0,
                );
                return (
                  <li key={session.id}>
                    <Link
                      href={`/treino/${session.id}`}
                      className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-secondary/60"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
                        <Dumbbell className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{session.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(session.startedAt, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          · {formatDuration(session.durationSeconds)} ·{" "}
                          {Math.round(totalVolume).toLocaleString("pt-BR")} kg
                        </p>
                      </div>
                      {prs > 0 && (
                        <Badge variant="warning">
                          <Sparkles className="size-3" />
                          {prs} PR{prs > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TemplateGrid({
  templates,
}: {
  templates: Awaited<ReturnType<typeof getTemplates>>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <Card
          key={template.id}
          className="group flex flex-col transition-colors hover:border-brand/35"
        >
          <CardContent className="flex flex-1 flex-col gap-3 p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/treinos/${template.id}`}
                  className="font-semibold tracking-tight hover:text-brand"
                >
                  {template.name}
                </Link>
                {template.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {template.description}
                  </p>
                )}
              </div>
              {template.isSystem && (
                <Badge variant="accent" className="shrink-0">
                  <Sparkles className="size-3" />
                  Modelo
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
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
                  {template.daysPerWeek}x/sem
                </Badge>
              )}
            </div>

            {template.equipment.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Equipamento:{" "}
                {template.equipment
                  .map((e) => EQUIPMENT_LABELS[e as keyof typeof EQUIPMENT_LABELS] ?? e)
                  .join(", ")}
              </p>
            )}

            <div className="mt-auto flex items-center gap-2 pt-1">
              <StartWorkoutButton
                templateId={template.id}
                label="Iniciar"
                className="flex-1"
              />
              <Button asChild variant="outline" size="sm">
                <Link href={`/treinos/${template.id}`}>Ver</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
