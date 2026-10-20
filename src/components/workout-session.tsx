"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Flame,
  Lightbulb,
  Link2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Square,
  Timer as TimerIcon,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EQUIPMENT_LABELS, type Equipment } from "@/lib/domain/types";
import { cn, formatClock } from "@/lib/utils";
import {
  abandonSession,
  completeSession,
  updateSet,
} from "@/server/actions/workouts";

export type SessionSet = {
  id: string;
  order: number;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  completed: boolean;
  isPr: boolean;
};

export type SessionItem = {
  id: string;
  order: number;
  notes: string | null;
  exercise: {
    id: string;
    slug: string;
    name: string;
    primaryMuscle: string;
    equipment: string;
    instructions: string[];
    tips: string[];
    commonMistakes: string[];
    breathing: string | null;
  };
  sets: SessionSet[];
};

type Props = {
  sessionId: string;
  name: string;
  startedAt: string;
  items: SessionItem[];
  defaultRestSeconds: number;
};

export function WorkoutSession({
  sessionId,
  name,
  startedAt,
  items,
  defaultRestSeconds,
}: Props) {
  const router = useRouter();
  const [sets, setSets] = React.useState<Record<string, SessionSet>>(() => {
    const map: Record<string, SessionSet> = {};
    for (const item of items) {
      for (const set of item.sets) map[set.id] = set;
    }
    return map;
  });

  const [elapsed, setElapsed] = React.useState(0);
  const [rest, setRest] = React.useState(0);
  const [restTotal, setRestTotal] = React.useState(0);
  const [restRunning, setRestRunning] = React.useState(false);
  const [expanded, setExpanded] = React.useState<string | null>(items[0]?.id ?? null);
  const [finishing, setFinishing] = React.useState(false);

  // Rascunho local dos campos de série: mantém o que o usuário digitado
  // visível na tela e permite salvar mesmo sem sair do campo.
  const [drafts, setDrafts] = React.useState<
    Record<string, { weightKg: string; reps: string; rpe: string }>
  >({});
  // Espelho síncrono dos rascunhos: o debounce precisa do valor mais recente,
  // e um callback disparado por timer enxergaria o estado antigo.
  const draftsRef = React.useRef(drafts);
  const timers = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  React.useEffect(
    () => () => {
      for (const timer of Object.values(timers.current)) clearTimeout(timer);
    },
    [],
  );

  // Cronômetro de sessão
  React.useEffect(() => {
    const started = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - started) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  // Cronômetro de descanso
  React.useEffect(() => {
    if (!restRunning) return;
    if (rest <= 0) {
      setRestRunning(false);
      return;
    }
    const id = window.setTimeout(() => setRest((r) => Math.max(0, r - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [rest, restRunning]);

  React.useEffect(() => {
    if (rest === 0 && restTotal > 0 && !restRunning) {
      toast.success("Descanso encerrado — bora para a próxima série");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rest, restRunning]);

  function startRest(seconds: number) {
    setRestTotal(seconds);
    setRest(seconds);
    setRestRunning(true);
  }

  async function persist(setId: string, patch: Parameters<typeof updateSet>[1]) {
    setSets((prev) => ({
      ...prev,
      [setId]: { ...prev[setId], ...patch } as SessionSet,
    }));
    try {
      const result = await updateSet(setId, patch);
      if (result.isPr) {
        toast.success("Novo recorde pessoal! 🎉", {
          description: "O coach registrou sua marca.",
        });
      }
    } catch {
      toast.error("Não foi possível salvar a série");
    }
  }

  /** Converte o rascunho textual em valores numéricos (null quando vazio). */
  function draftToPatch(setId: string) {
    const draft = draftsRef.current[setId];
    if (!draft) return null;
    const weightKg = draft.weightKg.trim() === "" ? null : Number(draft.weightKg);
    const reps = draft.reps.trim() === "" ? null : Number(draft.reps);
    const rpe = draft.rpe.trim() === "" ? null : Number(draft.rpe);
    if (
      weightKg === sets[setId]?.weightKg &&
      reps === sets[setId]?.reps &&
      rpe === sets[setId]?.rpe
    ) {
      return null;
    }
    return { weightKg, reps, rpe };
  }

  /** Salva o rascunho com debounce, para não perder o que foi digitado. */
  function schedulePersist(setId: string) {
    if (timers.current[setId]) clearTimeout(timers.current[setId]);
    timers.current[setId] = setTimeout(() => {
      const patch = draftToPatch(setId);
      if (patch) void persist(setId, patch);
    }, 700);
  }

  function handleDraftChange(
    setId: string,
    field: "weightKg" | "reps" | "rpe",
    value: string,
  ) {
    const next = {
      weightKg: draftsRef.current[setId]?.weightKg ?? "",
      reps: draftsRef.current[setId]?.reps ?? "",
      rpe: draftsRef.current[setId]?.rpe ?? "",
      [field]: value,
    };
    draftsRef.current = { ...draftsRef.current, [setId]: next };
    setDrafts(draftsRef.current);
    schedulePersist(setId);
  }

  function flushDraft(setId: string) {
    if (timers.current[setId]) {
      clearTimeout(timers.current[setId]);
      delete timers.current[setId];
    }
    const patch = draftToPatch(setId);
    if (patch) void persist(setId, patch);
  }

  async function handleComplete(setId: string, restSeconds: number) {
    const set = sets[setId];
    if (!set) return;

    // Garante que o que foi digitado vai para o banco antes de concluir.
    flushDraft(setId);
    await persist(setId, { completed: !set.completed });

    if (!set.completed) startRest(restSeconds);
  }

  async function handleFinish() {
    setFinishing(true);
    try {
      const result = await completeSession(sessionId);
      toast.success("Treino concluído!", {
        description: `Duração de ${Math.round(result.durationSeconds / 60)} minutos.`,
      });
      if (result.unlocked.length > 0) {
        toast.success(
          `Conquista desbloqueada: ${result.unlocked[0].title}`,
          { description: result.unlocked.length > 1 ? `+${result.unlocked.length - 1} outras` : undefined },
        );
      }
      router.push("/painel");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível finalizar",
      );
      setFinishing(false);
    }
  }

  async function handleAbandon() {
    await abandonSession(sessionId);
    toast.info("Treino descartado");
    router.push("/treinos");
    router.refresh();
  }

  // O estado local é a fonte da verdade durante a sessão. Assim a interface
  // responde na hora, sem depender do round-trip da server action.
  const currentItems = items.map((item) => ({
    ...item,
    sets: item.sets.map((set) => sets[set.id] ?? set),
  }));
  const totalSets = currentItems.reduce((acc, item) => acc + item.sets.length, 0);
  const doneSets = currentItems.reduce(
    (acc, item) => acc + item.sets.filter((s) => s.completed).length,
    0,
  );
  const progress = totalSets > 0 ? (doneSets / totalSets) * 100 : 0;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 pb-40">
      {/* Cabeçalho */}
      <header className="sticky top-16 z-20 -mx-4 border-b border-border/70 bg-background/85 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow text-muted">Sessão em andamento</p>
            <h1 className="mt-1.5 truncate font-display text-[clamp(1.7rem,3.4vw,2.6rem)] leading-[0.95] text-foreground">
              {name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1.5 border-border-soft bg-background/60 px-3 py-1.5 text-[11px] tabular-nums text-fg-2"
              >
                <TimerIcon className="size-3.5 text-clay" />
                {formatClock(elapsed)}
              </Badge>
              <Badge
                variant="brand"
                className="px-3 py-1.5 text-[11px] tabular-nums"
              >
                {doneSets}/{totalSets} séries
              </Badge>
              <span className="text-[11px] font-medium text-muted">
                {Math.round(progress)}% concluído
              </span>
            </div>
          </div>
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAbandon}
              className="border-border-soft text-muted hover:border-danger/30 hover:bg-danger/[0.04] hover:text-danger"
            >
              Descartar
            </Button>
            <Button
              variant="brand"
              size="sm"
              onClick={handleFinish}
              loading={finishing}
              className="shadow-none"
            >
              <Check className="size-4" />
              Finalizar
            </Button>
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
          <div
            className="h-full rounded-full bg-lime transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <div className="flex items-end justify-between gap-3 px-0.5">
        <div>
          <p className="eyebrow text-muted">Seu treino de hoje</p>
          <h2 className="mt-1 font-display text-2xl leading-none text-foreground">
            Exercícios
          </h2>
        </div>
        <p className="text-right text-[11px] leading-relaxed text-muted">
          {items.length} movimentos
          <br />
          {totalSets} séries
        </p>
      </div>

      {/* Exercícios */}
      {currentItems.map((item) => {
        const isOpen = expanded === item.id;
        const itemDone = item.sets.filter((s) => s.completed).length;
        const equipmentLabel =
          EQUIPMENT_LABELS[item.exercise.equipment as Equipment] ??
          item.exercise.equipment;

        return (
          <Card
            key={item.id}
            className={cn(
              "overflow-hidden transition-colors",
              itemDone === item.sets.length && "border-success/30",
            )}
          >
            <CardContent className="p-0">
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : item.id)}
                className="flex w-full items-center gap-3.5 p-4 text-left transition-colors hover:bg-surface/60 sm:p-5"
              >
                <span
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-full border text-[11px] font-semibold tabular-nums transition-colors",
                    itemDone === item.sets.length
                      ? "border-transparent bg-brand text-brand-foreground"
                      : "border-border-soft bg-surface text-fg-2",
                  )}
                >
                  {itemDone}/{item.sets.length}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold leading-snug tracking-[-0.015em] text-foreground sm:text-base">
                    {item.exercise.name}
                  </span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                    {item.exercise.equipment !== "none" && (
                      <Badge
                        variant="muted"
                        className="px-2 py-[3px] text-[10px]"
                      >
                        {equipmentLabel}
                      </Badge>
                    )}
                    {item.notes && (
                      <span className="truncate">{item.notes}</span>
                    )}
                  </span>
                </span>
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full border border-border-soft bg-surface text-muted transition-all",
                    isOpen && "rotate-180 bg-foreground text-background",
                  )}
                >
                  <ChevronDown className="size-4" />
                </span>
              </button>

              {isOpen && (
                <div className="space-y-4 border-t border-border-soft px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
                  {/* Guia de execução */}
                  <details className="group rounded-2xl border border-border-soft bg-surface/40 p-3.5 [&::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer list-none items-center gap-2.5 text-sm font-medium text-foreground">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                        <Lightbulb className="size-3.5" />
                      </span>
                      Como executar
                      <ChevronDown className="ml-auto size-3.5 text-muted transition-transform group-open:rotate-180" />
                    </summary>
                    <ol className="mt-3.5 space-y-2.5">
                      {item.exercise.instructions.map((step, i) => (
                        <li key={i} className="flex gap-2.5 text-[13px]">
                          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-soft text-[10px] font-semibold text-brand">
                            {i + 1}
                          </span>
                          <span className="text-muted">{step}</span>
                        </li>
                      ))}
                    </ol>
                    {item.exercise.tips.length > 0 && (
                      <div className="mt-3.5 rounded-xl border border-brand/20 bg-brand/[0.06] p-3">
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand">
                          Dicas de execução
                        </p>
                        <ul className="space-y-1.5">
                          {item.exercise.tips.map((tip, i) => (
                            <li
                              key={i}
                              className="flex gap-2 text-[12px] leading-relaxed text-muted"
                            >
                              <span className="text-brand">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {item.exercise.breathing && (
                      <p className="mt-3 text-[12px] leading-relaxed text-muted">
                        <span className="font-semibold text-foreground">
                          Respiração:
                        </span>{" "}
                        {item.exercise.breathing}
                      </p>
                    )}
                    <Link
                      href={`/exercicios/${item.exercise.slug}`}
                      className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
                    >
                      Ver todos os detalhes e erros comuns
                      <Link2 className="size-3" />
                    </Link>
                  </details>

                  {/* Séries */}
                  <div className="overflow-hidden rounded-2xl border border-border-soft bg-background/40">
                    <div className="grid grid-cols-[2.2rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem] gap-2 border-b border-border-soft bg-surface/70 px-3 py-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
                      <span>Série</span>
                      <span>kg</span>
                      <span>reps</span>
                      <span>RPE</span>
                      <span />
                    </div>
                    <ul className="divide-y divide-border-soft">
                      {item.sets.map((set) => {
                        const draft = drafts[set.id];
                        const completed = sets[set.id]?.completed ?? set.completed;
                        const isPr = sets[set.id]?.isPr ?? set.isPr;
                        return (
                          <li
                            key={set.id}
                            className={cn(
                              "grid grid-cols-[2.2rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem] items-center gap-2 px-3 py-2.5 transition-colors",
                              completed && "bg-success/[0.045]",
                            )}
                          >
                            <span className="flex items-center gap-1 text-[12px] font-semibold tabular-nums text-foreground">
                              {set.order + 1}
                              {isPr && (
                                <Flame
                                  className="size-3.5 text-clay"
                                  aria-label="Recorde pessoal"
                                />
                              )}
                            </span>
                            <Input
                              type="number"
                              inputMode="decimal"
                              className="h-9 rounded-xl border-border-soft bg-background/70 px-1 text-center text-[12px] tabular-nums"
                              placeholder="0"
                              value={draft?.weightKg ?? (set.weightKg ?? "")}
                              onChange={(e) =>
                                handleDraftChange(set.id, "weightKg", e.target.value)
                              }
                              onBlur={() => flushDraft(set.id)}
                            />
                            <Input
                              type="number"
                              inputMode="numeric"
                              className="h-9 rounded-xl border-border-soft bg-background/70 px-1 text-center text-[12px] tabular-nums"
                              placeholder="0"
                              value={draft?.reps ?? (set.reps ?? "")}
                              onChange={(e) =>
                                handleDraftChange(set.id, "reps", e.target.value)
                              }
                              onBlur={() => flushDraft(set.id)}
                            />
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={10}
                              className="h-9 rounded-xl border-border-soft bg-background/70 px-1 text-center text-[12px] tabular-nums"
                              placeholder="—"
                              value={draft?.rpe ?? (set.rpe ?? "")}
                              onChange={(e) =>
                                handleDraftChange(set.id, "rpe", e.target.value)
                              }
                              onBlur={() => flushDraft(set.id)}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleComplete(set.id, defaultRestSeconds)
                              }
                              aria-label={
                                completed ? "Desmarcar série" : "Concluir série"
                              }
                              className={cn(
                                "grid size-9 place-items-center rounded-full border transition-all",
                                completed
                                  ? "border-transparent bg-brand text-brand-foreground"
                                  : "border-border-soft bg-background text-muted hover:border-brand/40 hover:text-brand",
                              )}
                            >
                              {completed ? (
                                <Check className="size-4" strokeWidth={3} />
                              ) : (
                                <Square className="size-3 opacity-50" />
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {item.exercise.commonMistakes.length > 0 && (
                    <details className="group rounded-2xl border border-warn/20 bg-warn/[0.035] p-3.5 [&::-webkit-details-marker]:hidden">
                      <summary className="flex cursor-pointer list-none items-center gap-2.5 text-sm font-medium text-foreground">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-warn/12 text-warn">
                          <AlertTriangle className="size-3.5" />
                        </span>
                        Erros comuns
                        <ChevronDown className="ml-auto size-3.5 text-muted transition-transform group-open:rotate-180" />
                      </summary>
                      <ul className="mt-3 space-y-1.5">
                        {item.exercise.commonMistakes.map((mistake, i) => (
                          <li
                            key={i}
                            className="flex gap-2 text-[12px] leading-relaxed text-muted"
                          >
                            <span className="text-warn">•</span>
                            {mistake}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Barra do cronômetro de descanso */}
      {restTotal > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 lg:left-[264px] lg:px-6 lg:pb-4">
          <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-[26px] border border-white/10 bg-ink/95 px-3.5 py-3 text-cream shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl">
            <span
              className={cn(
                "grid size-11 shrink-0 place-items-center rounded-2xl",
                restRunning
                  ? "bg-lime text-lime-ink"
                  : "bg-white/[0.07] text-cream/60",
              )}
            >
              <TimerIcon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[30px] tabular-nums leading-none text-cream">
                {formatClock(rest)}
              </p>
              <p className="mt-1 text-[11px] text-cream/45">
                {restRunning
                  ? "Descanso em andamento"
                  : rest > 0
                    ? "Descanso pausado"
                    : "Pronto para a próxima série"}
              </p>
            </div>
            {rest > 0 && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={restRunning ? "Pausar descanso" : "Retomar descanso"}
                className="text-cream/70 hover:bg-white/10 hover:text-cream"
                onClick={() => setRestRunning((running) => !running)}
              >
                {restRunning ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startRest(rest + 30)}
              className="text-cream/70 hover:bg-white/10 hover:text-cream"
            >
              <Plus className="size-3.5" />
              30s
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Encerrar descanso"
              className="text-cream/50 hover:bg-white/10 hover:text-cream"
              onClick={() => {
                setRest(0);
                setRestTotal(0);
                setRestRunning(false);
              }}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 lg:left-[264px] lg:px-6 lg:pb-4">
          <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-[26px] border border-white/10 bg-ink/95 px-3.5 py-3 text-cream shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/[0.07] text-lime">
              <TimerIcon className="size-4" />
            </span>
            <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-cream/55">
              Conclua uma série para iniciar o descanso automaticamente.
            </p>
            <Button
              variant="brand"
              size="sm"
              className="shrink-0 shadow-none"
              onClick={() => startRest(defaultRestSeconds)}
            >
              <RotateCcw className="size-3.5" />
              {defaultRestSeconds}s
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
