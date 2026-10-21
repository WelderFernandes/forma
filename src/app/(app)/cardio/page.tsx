import type { Metadata } from "next";
import Image from "next/image";
import {
  Activity,
  Bike,
  CalendarDays,
  Check,
  Footprints,
  MapPin,
  Mountain,
  Sparkles,
  Sun,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { AddCardioButton } from "@/components/cardio/add-cardio-button";
import { CompleteCardioButton } from "@/components/cardio/complete-cardio-button";
import { getCurrentUser } from "@/server/auth-helpers";
import { getCardioSessions, getProfile } from "@/server/queries";
import {
  WEEKDAYS,
  formatTrainingDays,
  isTrainingDay,
  normalizeTrainingDays,
  startOfWeek,
} from "@/lib/domain/schedule";
import {
  CARDIO_INTENSITY_LABELS,
  activityLabel,
  formatDistance,
  type CardioActivity,
  type CardioIntensity,
} from "@/lib/domain/cardio";
import {
  addDays,
  cn,
  dayKey,
  formatDate,
  formatNumber,
  startOfDay,
} from "@/lib/utils";

export const metadata: Metadata = {
  title: "Cardio ao ar livre",
};

const ACTIVITY_ICON = {
  walk: Footprints,
  run: Activity,
  hike: Mountain,
  cycle: Bike,
  other: MapPin,
} as const;

export default async function CardioPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [profile, sessions] = await Promise.all([
    getProfile(user.id),
    getCardioSessions(user.id, { limit: 250 }),
  ]);

  const today = startOfDay(new Date());
  const todayKey = dayKey(today);
  const monday = startOfWeek(today);
  const trainingDays = normalizeTrainingDays(
    profile?.trainingDays,
    profile?.daysPerWeek ?? 3,
  );

  const week = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(monday, index);
    const key = dayKey(date);
    return {
      date,
      key,
      label: WEEKDAYS[index].short,
      isToday: key === todayKey,
      training: isTrainingDay(trainingDays, date),
      entries: sessions.filter((entry) => dayKey(entry.date) === key),
    };
  });

  const weekEntries = week.flatMap((day) => day.entries);
  const completedWeek = weekEntries.filter(
    (entry) => entry.status === "completed",
  );
  const plannedWeek = weekEntries.filter((entry) => entry.status === "planned");
  const weekMinutes = completedWeek.reduce(
    (total, entry) => total + entry.durationMinutes,
    0,
  );
  const weekDistance = completedWeek.reduce(
    (total, entry) => total + (entry.distanceKm ?? 0),
    0,
  );

  const upcoming = sessions
    .filter((entry) => entry.status === "planned")
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const history = sessions
    .filter((entry) => entry.status === "completed")
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ritmo · ar livre"
        title="Cardio ao ar livre"
        description="Caminhadas, corridas e pedais em uma agenda própria — nos dias de treino ou nos dias livres."
        actions={
          <AddCardioButton
            defaultDate={todayKey}
            weightKg={profile?.weightKg}
            label="Adicionar cardio"
            variant="brand"
          />
        }
      />

      <Card
        variant="feature"
        hoverable={false}
        className="relative overflow-hidden"
      >
        <Image
          src="/media/run.jpg"
          alt="Pessoas correndo ao ar livre"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1000px"
          className="object-cover opacity-25 photo-warm"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/40" />
        <div className="relative z-10 grid gap-7 p-6 sm:p-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end lg:p-9">
          <div>
            <span className="eyebrow text-lime">Movimento com espaço</span>
            <h2 className="mt-3 max-w-xl font-display text-[clamp(2rem,4vw,3.2rem)] leading-[0.96] text-cream">
              Corra, caminhe,
              <br />
              <em className="text-lime">respire.</em>
            </h2>
            <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-cream/50">
              O cardio não precisa competir com a musculação. Ele pode ser o
              seu descanso ativo, um respiro na rotina ou um treino inteiro.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3.5 backdrop-blur">
              <CalendarDays className="size-4 text-lime" />
              <p className="mt-2.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-cream/35">
                Treinos
              </p>
              <p className="mt-0.5 text-[12px] font-medium text-cream">
                {formatTrainingDays(trainingDays)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3.5 backdrop-blur">
              <Sun className="size-4 text-clay" />
              <p className="mt-2.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-cream/35">
                Dias livres
              </p>
              <p className="mt-0.5 text-[12px] font-medium text-cream">
                abertos para cardio
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Footprints}
          label="Cardios na semana"
          value={completedWeek.length}
          unit={completedWeek.length === 1 ? "concluído" : "concluídos"}
          hint={`${plannedWeek.length} ainda planejado${plannedWeek.length === 1 ? "" : "s"}`}
          accent="brand"
        />
        <StatCard
          icon={Timer}
          label="Tempo em movimento"
          value={formatNumber(weekMinutes)}
          unit="min"
          hint="Cardio concluído nesta semana"
        />
        <StatCard
          icon={MapPin}
          label="Distância"
          value={formatNumber(weekDistance, weekDistance % 1 === 0 ? 0 : 1)}
          unit="km"
          hint="Somente percursos registrados"
        />
        <StatCard
          icon={CalendarDays}
          label="Próximos"
          value={upcoming.length}
          unit={upcoming.length === 1 ? "cardio" : "cardios"}
          hint="Pendentes na agenda"
        />
      </div>

      <Card hoverable={false}>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 pb-4">
          <div>
            <p className="eyebrow text-muted">Segunda a domingo</p>
            <CardTitle className="mt-2 font-display text-[28px] font-normal">
              Sua semana
            </CardTitle>
            <p className="mt-1 text-[12px] text-muted">
              {formatDate(monday, { day: "2-digit", month: "short" })} —{" "}
              {formatDate(addDays(monday, 6), { day: "2-digit", month: "short" })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-brand" /> treino
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-clay" /> cardio
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-foreground/20" /> livre
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {week.map((day) => {
              const completed = day.entries.filter(
                (entry) => entry.status === "completed",
              );
              const planned = day.entries.filter(
                (entry) => entry.status === "planned",
              );
              return (
                <div
                  key={day.key}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3 transition-colors sm:flex-col sm:items-stretch sm:gap-0 sm:min-h-[168px]",
                    day.isToday
                      ? "border-foreground/30 bg-surface-warm/70"
                      : day.training
                        ? "border-brand/25 bg-brand-soft/35"
                        : "border-border-soft bg-surface/45",
                  )}
                >
                  <div className="flex shrink-0 items-center gap-2 sm:justify-between">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted">
                      {day.label}
                    </span>
                    <span
                      className={cn(
                        "grid size-6 place-items-center rounded-full text-[10px] font-semibold",
                        day.isToday
                          ? "bg-foreground text-background"
                          : "bg-foreground/[0.055] text-fg-2",
                      )}
                    >
                      {day.date.getDate()}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 sm:mt-3 sm:flex-none">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em]",
                        day.training
                          ? "bg-brand/10 text-brand"
                          : "bg-foreground/[0.05] text-muted",
                      )}
                    >
                      {day.training ? "Treino" : "Descanso"}
                    </span>

                    <div className="mt-2 space-y-1">
                      {day.entries.length === 0 ? (
                        <p className="text-[10px] leading-relaxed text-muted">
                          {day.training
                            ? "Sem cardio planejado."
                            : "Livre para um cardio leve."}
                        </p>
                      ) : (
                        day.entries.slice(0, 2).map((entry) => {
                          const Icon =
                            ACTIVITY_ICON[entry.activity as CardioActivity] ??
                            Activity;
                          return (
                            <div
                              key={entry.id}
                              className="flex items-start gap-1.5 text-[10px] leading-snug"
                            >
                              <Icon
                                className={cn(
                                  "mt-0.5 size-3 shrink-0",
                                  entry.status === "completed"
                                    ? "text-clay"
                                    : "text-muted",
                                )}
                              />
                              <span className="min-w-0 text-fg-2">
                                {activityLabel(entry.activity)}
                                <span className="block text-[9px] text-muted">
                                  {entry.durationMinutes} min ·{" "}
                                  {entry.status === "completed"
                                    ? "feito"
                                    : "planejado"}
                                </span>
                              </span>
                            </div>
                          );
                        })
                      )}
                      {day.entries.length > 2 && (
                        <p className="text-[9px] text-muted">
                          +{day.entries.length - 2} cardio(s)
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1 sm:mt-auto sm:pt-3">
                    {planned.length > 0 && (
                      <CompleteCardioButton
                        cardioId={planned[0].id}
                        compact
                        className="size-7 border-border bg-card"
                      />
                    )}
                    {completed.length > 0 ? (
                      <span className="grid size-7 place-items-center rounded-full bg-clay/10 text-clay">
                        <Check className="size-3.5" strokeWidth={2.5} />
                      </span>
                    ) : (
                      <AddCardioButton
                        defaultDate={day.key}
                        weightKg={profile?.weightKg}
                        compact
                        variant="ghost"
                        className="size-7 text-muted hover:text-foreground"
                        label="Adicionar cardio neste dia"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-4 flex items-start gap-2 rounded-xl bg-surface/70 px-3.5 py-3 text-[11px] leading-relaxed text-muted">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-clay" />
            Caminhar em um dia de descanso não atrapalha a recuperação. Use o
            bom senso, hidrate-se e mantenha a intensidade confortável.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card hoverable={false}>
          <CardHeader className="flex-row items-start justify-between gap-3 pb-4">
            <div>
              <p className="eyebrow text-muted">Agenda</p>
              <CardTitle className="mt-2 font-display text-[28px] font-normal">
                Próximos cardios
              </CardTitle>
            </div>
            <Badge variant="outline">{upcoming.length}</Badge>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <EmptyState
                icon={Footprints}
                title="Nenhum cardio planejado"
                description="Escolha um dia livre e adicione uma caminhada leve, uma corrida ou um pedal."
                className="border-0 bg-transparent px-2 py-8"
                action={
                  <AddCardioButton
                    defaultDate={todayKey}
                    weightKg={profile?.weightKg}
                    label="Planejar cardio"
                    variant="brand"
                    size="sm"
                  />
                }
              />
            ) : (
              <ul className="space-y-2">
                {upcoming.slice(0, 8).map((entry) => (
                  <CardioEntryRow
                    key={entry.id}
                    entry={entry}
                    tone="planned"
                    overdue={dayKey(entry.date) < todayKey}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card hoverable={false}>
          <CardHeader className="flex-row items-start justify-between gap-3 pb-4">
            <div>
              <p className="eyebrow text-muted">Histórico</p>
              <CardTitle className="mt-2 font-display text-[28px] font-normal">
                Já na rua
              </CardTitle>
            </div>
            <Badge variant="success">{history.length}</Badge>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="Seu histórico começa no primeiro passo"
                description="Quando concluir um cardio, ele aparece aqui com duração, distância e intensidade."
                className="border-0 bg-transparent px-2 py-8"
              />
            ) : (
              <ul className="space-y-2">
                {history.slice(0, 8).map((entry) => (
                  <CardioEntryRow key={entry.id} entry={entry} tone="done" />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mx-auto max-w-2xl pt-2 text-center text-[10.5px] leading-relaxed text-muted">
        O Forma é uma ferramenta de bem-estar geral e não substitui avaliação
        médica. Se você sente dor, tontura ou tem alguma condição de saúde,
        procure um profissional antes de aumentar a intensidade.
      </p>
    </div>
  );
}

function CardioEntryRow({
  entry,
  tone,
  overdue = false,
}: {
  entry: Awaited<ReturnType<typeof getCardioSessions>>[number];
  tone: "planned" | "done";
  overdue?: boolean;
}) {
  const Icon =
    ACTIVITY_ICON[entry.activity as CardioActivity] ?? Activity;
  const distance = formatDistance(entry.distanceKm);

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl border border-border-soft bg-surface/55 p-3">
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          tone === "done"
            ? "bg-clay/10 text-clay"
            : "bg-brand-soft text-brand",
        )}
      >
        <Icon className="size-4" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13px] font-medium">
            {activityLabel(entry.activity)}
          </p>
          {tone === "planned" && overdue && (
            <Badge variant="warning" className="text-[9px]">
              Pendente
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-muted">
          {formatDate(entry.date, {
            weekday: "short",
            day: "2-digit",
            month: "short",
          })}{" "}
          · {entry.durationMinutes} min ·{" "}
          {CARDIO_INTENSITY_LABELS[
            entry.intensity as CardioIntensity
          ] ?? "Moderada"}
          {distance ? ` · ${distance}` : ""}
        </p>
        {entry.notes && (
          <p className="mt-1 line-clamp-1 text-[10.5px] text-muted">
            {entry.notes}
          </p>
        )}
      </div>
      {tone === "planned" ? (
        <CompleteCardioButton cardioId={entry.id} />
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-medium text-success">
          <Check className="size-3" />
          Concluído
        </span>
      )}
    </li>
  );
}
