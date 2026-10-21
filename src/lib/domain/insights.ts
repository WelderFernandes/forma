/**
 * Coach inteligente — motor de insights determinístico.
 *
 * Analisa o histórico de treino do usuário e devolve recomendações explicáveis.
 * Não usa LLM: cada insight é rastreável a uma regra documentada, o que mantém
 * o app rápido, offline e auditável.
 */

import { average, clamp, daysBetween, startOfDay } from "../utils";
import { calculateOneRepMax } from "./calculators";

export type InsightTone = "positive" | "info" | "warning" | "danger";

export type Insight = {
  id: string;
  tone: InsightTone;
  category: string;
  title: string;
  body: string;
  /** Ação sugerida — aponta para uma rota do app. */
  action?: { label: string; href: string };
  /** Métrica que originou o insight (exibida como chip). */
  metric?: string;
};

export type SessionSummary = {
  id: string;
  name: string;
  startedAt: Date;
  completedAt: Date | null;
  durationSeconds: number | null;
  status: string;
  items: {
    exerciseId: string;
    exerciseName: string;
    primaryMuscle: string;
    sets: {
      weightKg: number | null;
      reps: number | null;
      rpe: number | null;
      completed: boolean;
      isPr: boolean;
    }[];
  }[];
};

export type BodyEntry = {
  date: Date;
  weightKg: number | null;
  bodyFatPct: number | null;
};

export type InsightInput = {
  sessions: SessionSummary[];
  bodyEntries: BodyEntry[];
  goal: string | null | undefined;
  daysPerWeek: number;
  weekStart?: Date;
};

const MUSCLE_LABEL: Record<string, string> = {
  peito: "Peito",
  costas: "Costas",
  ombro: "Ombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  antebraco: "Antebraços",
  quadril: "Quadril",
  posterior_coxa: "Posterior de coxa",
  coxa: "Coxa",
  panturrilha: "Panturrilha",
  core: "Core",
  gluteos: "Glúteos",
  lombar: "Lombar",
  corpo_inteiro: "Corpo inteiro",
  cardio: "Cardio",
};

const WEEKLY_SET_TARGETS: Record<string, number> = {
  peito: 12,
  costas: 14,
  ombro: 12,
  biceps: 8,
  triceps: 8,
  coxa: 12,
  posterior_coxa: 10,
  gluteos: 10,
  panturrilha: 8,
  core: 8,
};

// ───────────────────────────── Análises ─────────────────────────────

export function currentStreak(sessions: SessionSummary[]): number {
  const completed = sessions
    .filter((s) => s.status === "completed" && s.completedAt)
    .map((s) => startOfDay(s.completedAt ?? s.startedAt))
    .sort((a, b) => b.getTime() - a.getTime());

  if (completed.length === 0) return 0;

  const today = startOfDay();
  const gap = daysBetween(completed[0], today);
  // Sequência quebrada se o último treino foi há mais de 2 dias.
  if (gap > 2) return 0;

  let streak = 1;
  for (let i = 1; i < completed.length; i++) {
    const delta = daysBetween(completed[i], completed[i - 1]);
    if (delta === 1) streak += 1;
    else if (delta > 1) break;
  }
  return streak;
}

export function longestStreak(sessions: SessionSummary[]): number {
  const days = Array.from(
    new Set(
      sessions
        .filter((s) => s.status === "completed")
        .map((s) => daysBetween(startOfDay(s.startedAt), startOfDay()) + 1),
    ),
  ).sort((a, b) => a - b);

  let best = 0;
  let current = 0;
  for (let i = 0; i < days.length; i++) {
    if (i > 0 && days[i] - days[i - 1] === 1) current += 1;
    else current = 1;
    best = Math.max(best, current);
  }
  return best;
}

export function adherenceRate(
  sessions: SessionSummary[],
  daysPerWeek: number,
  weeks = 4,
): number {
  const completed = sessions.filter((s) => s.status === "completed");
  if (completed.length === 0) return 0;
  const now = startOfDay();
  const recent = completed.filter((s) => {
    const age = daysBetween(startOfDay(s.startedAt), now);
    return age < weeks * 7;
  });
  const expected = weeks * daysPerWeek;
  return clamp(Math.round((recent.length / Math.max(1, expected)) * 100), 0, 100);
}

/** Volume (séries efetivas) por grupo muscular nos últimos 7 dias. */
export function weeklySetsByMuscle(
  sessions: SessionSummary[],
): Record<string, number> {
  const now = startOfDay();
  const totals: Record<string, number> = {};
  for (const session of sessions) {
    if (session.status !== "completed") continue;
    if (daysBetween(startOfDay(session.startedAt), now) > 7) continue;
    for (const item of session.items) {
      const effective = item.sets.filter((s) => s.completed).length;
      totals[item.primaryMuscle] = (totals[item.primaryMuscle] ?? 0) + effective;
    }
  }
  return totals;
}

/** Detecta sobrecarga por RPE médio muito alto emsessions recentes. */
export function averageRpe(sessions: SessionSummary[]): number {
  const values: number[] = [];
  for (const session of sessions) {
    if (session.status !== "completed") continue;
    for (const item of session.items) {
      for (const set of item.sets) {
        if (set.completed && set.rpe) values.push(set.rpe);
      }
    }
  }
  return average(values);
}

/**
 * Progressão de carga por exercício: compara o melhor set (estimativa de 1RM)
 * entre as duas últimas execuções do mesmo exercício.
 */
export function progressionByExercise(
  sessions: SessionSummary[],
): { exerciseId: string; exerciseName: string; previous: number; current: number; deltaPct: number }[] {
  const byExercise = new Map<
    string,
    { name: string; best: number; at: number }[]
  >();

  for (const session of sessions) {
    if (session.status !== "completed") continue;
    const at = session.startedAt.getTime();
    for (const item of session.items) {
      const best = bestEstimate(item.sets);
      if (!best) continue;
      const list = byExercise.get(item.exerciseId) ?? [];
      list.push({ name: item.exerciseName, best, at });
      byExercise.set(item.exerciseId, list);
    }
  }

  const out: ReturnType<typeof progressionByExercise> = [];
  for (const [exerciseId, entries] of byExercise) {
    if (entries.length < 2) continue;
    entries.sort((a, b) => b.at - a.at);
    const current = entries[0].best;
    const previous = entries[1].best;
    if (!previous) continue;
    out.push({
      exerciseId,
      exerciseName: entries[0].name,
      previous: Math.round(previous),
      current: Math.round(current),
      deltaPct: Math.round(((current - previous) / previous) * 100),
    });
  }
  return out.sort((a, b) => b.deltaPct - a.deltaPct);
}

function bestEstimate(sets: SessionSummary["items"][number]["sets"]): number | null {
  const values = sets
    .filter((s) => s.completed && s.weightKg && s.reps)
    .map((s) => calculateOneRepMax(s.weightKg as number, s.reps as number).value);
  if (values.length === 0) return null;
  return Math.max(...values);
}

// ───────────────────────────── Motor ─────────────────────────────

export function buildInsights(input: InsightInput): Insight[] {
  const insights: Insight[] = [];
  const { sessions, goal, daysPerWeek } = input;

  const completed = sessions.filter((s) => s.status === "completed");

  // 1) Sequência e adesão
  const streak = currentStreak(sessions);
  const best = longestStreak(sessions);
  if (streak > 0) {
    insights.push({
      id: "streak",
      tone: "positive",
      category: "Consistência",
      title: `${streak} ${streak === 1 ? "treino" : "treinos"} seguidos`,
      body:
        streak >= 7
          ? "Uma semana inteira sem falhar. Consistência é o predictor nº1 de resultado em treino — mantenha o ritmo."
          : "Você está construindo o hábito certo. Repetição vence intensidade.",
      metric: streak >= best ? "recorde pessoal" : `recorde: ${best}`,
    });
  }

  const adherence = adherenceRate(sessions, daysPerWeek);
  if (completed.length > 0) {
    insights.push({
      id: "adherence",
      tone: adherence >= 80 ? "positive" : adherence >= 50 ? "info" : "warning",
      category: "Adesão",
      title: `${adherence}% de adesão nas últimas 4 semanas`,
      body:
        adherence >= 80
          ? `Você completou cerca de ${Math.round((adherence * daysPerWeek * 4) / 100)} dos ${daysPerWeek * 4} treinos planejados. Excelente consistência.`
          : `Seu plano pede ${daysPerWeek} treinos por semana. Encurte as sessões em vez de pulá-las: 20 minutos feitos valem mais que 50 minutos perfeitos.`,
      action: { label: "Ver plano", href: "/treinos" },
      metric: `${adherence}%`,
    });
  }

  // 2) Volume por grupo muscular
  const setsByMuscle = weeklySetsByMuscle(sessions);
  const under = Object.entries(setsByMuscle).filter(
    ([muscle, sets]) => WEEKLY_SET_TARGETS[muscle] && sets < WEEKLY_SET_TARGETS[muscle] * 0.6,
  );
  const over = Object.entries(setsByMuscle).filter(
    ([muscle, sets]) => WEEKLY_SET_TARGETS[muscle] && sets > WEEKLY_SET_TARGETS[muscle] * 1.6,
  );

  if (under.length > 0 && completed.length >= 2) {
    const [muscle, sets] = under.sort((a, b) => a[1] - b[1])[0];
    const target = WEEKLY_SET_TARGETS[muscle];
    insights.push({
      id: `under-${muscle}`,
      tone: "info",
      category: "Volume",
      title: `${MUSCLE_LABEL[muscle] ?? muscle} está subestimulado`,
      body: `Você fez ${sets} séries de ${MUSCLE_LABEL[muscle] ?? muscle} nos últimos 7 dias. A faixa para ${goal === "build_muscle" ? "hipertrofia" : "recomposição"} fica entre ${Math.round(target * 0.7)} e ${target} séries por semana.`,
      action: { label: "Ajustar ficha", href: "/treinos/novo" },
      metric: `${sets}/${target} séries`,
    });
  }

  if (over.length > 0) {
    const [muscle, sets] = over.sort((a, b) => b[1] - a[1])[0];
    insights.push({
      id: `over-${muscle}`,
      tone: "warning",
      category: "Volume",
      title: `${MUSCLE_LABEL[muscle] ?? muscle} pode estar cansando`,
      body: `${sets} séries em 7 dias é acima da faixa produtiva. Cansaço não é treino — reduza 1-2 séries ou aumente o descanso para 2-3 min.`,
      metric: `${sets} séries`,
    });
  }

  // 3) Fadiga (RPE)
  const rpe = averageRpe(sessions);
  if (completed.length >= 3) {
    if (rpe >= 9) {
      insights.push({
        id: "rpe-high",
        tone: "danger",
        category: "Recuperação",
        title: "Sinal de excesso de esforço",
        body: `Seu RPE médio está em ${rpe.toFixed(1)} (escala 1-10). Treinos acima de 9 por vários dias indicam fadiga acumulada — faça uma semana de alívio (deload) agora e durma mais.`,
        metric: `RPE ${rpe.toFixed(1)}`,
      });
    } else if (rpe > 0 && rpe <= 5) {
      insights.push({
        id: "rpe-low",
        tone: "info",
        category: "Intensidade",
        title: "Talvez você esteja thrive easy demais",
        body: `RPE médio de ${rpe.toFixed(1)} sugere que os pesos estão leves. Aumente 2,5–5% a carga nos exercícios principais e veja se as reps continuam na faixa.`,
        action: { label: "Treinar agora", href: "/treinos" },
        metric: `RPE ${rpe.toFixed(1)}`,
      });
    }
  }

  // 4) Progressão de carga
  const progression = progressionByExercise(sessions);
  const improving = progression.filter((p) => p.deltaPct >= 2.5);
  const stagnating = progression.filter((p) => p.deltaPct < -5);

  if (improving.length > 0) {
    const best = improving[0];
    insights.push({
      id: "progress",
      tone: "positive",
      category: "Progressão",
      title: `${best.exerciseName} subiu ${best.deltaPct}%`,
      body: `Sua estimativa de 1RM foi de ${best.previous} kg para ${best.current} kg. Mantenha a linha de progressão: +2,5% por semana já é o suficiente.`,
      metric: `+${best.deltaPct}%`,
    });
  }

  if (stagnating.length > 0 && completed.length >= 4) {
    const worst = stagnating[0];
    insights.push({
      id: "stagnation",
      tone: "warning",
      category: "Progressão",
      title: `${worst.exerciseName} parou de subir`,
      body: `O 1RM estimado caiu de ${worst.previous} kg para ${worst.current} kg. Possíveis causas: fadiga, sono, técnica ou necessidade de uma semana de alívio (deload).`,
      action: { label: "Ver histórico", href: "/progresso" },
      metric: `${worst.deltaPct}%`,
    });
  }

  // 5) Peso corporal
  const bodyEntries = [...input.bodyEntries]
    .filter((b) => b.weightKg)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  if (bodyEntries.length >= 2) {
    const first = bodyEntries[0];
    const last = bodyEntries[bodyEntries.length - 1];
    const delta = (last.weightKg as number) - (first.weightKg as number);
    const days = Math.max(1, daysBetween(first.date, last.date));
    const perWeek = (delta / days) * 7;

    if (goal === "lose_weight" && perWeek > 0.3) {
      insights.push({
        id: "weight-up",
        tone: "warning",
        category: "Peso",
        title: "Peso subindo acima do planejado",
        body: `Ganho de ${perWeek.toFixed(2)} kg por semana. Para emagrecimento, o alvo costuma ficar entre 0,3 e 0,7 kg por semana — revise o déficit calórico ou o volume de cardio.`,
        metric: `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg`,
      });
    } else if (goal === "lose_weight" && perWeek < -1.2) {
      insights.push({
        id: "weight-fast",
        tone: "danger",
        category: "Peso",
        title: "Déficit muito agressivo",
        body: `Perdendo ${Math.abs(perWeek).toFixed(2)} kg por semana. Abaixo de ~1% do peso corporal você perde músculo e desempenho. Aumente a ingestão em 150–200 kcal.`,
        metric: `${perWeek.toFixed(2)} kg/sem`,
      });
    } else if (goal === "build_muscle" && perWeek > 0.5) {
      insights.push({
        id: "weight-fast-gain",
        tone: "warning",
        category: "Peso",
        title: "Ganho de peso rápido demais",
        body: `${perWeek.toFixed(2)} kg por semana. Metade do ganho tende a ser gordura. Aproxime-se de 0,25–0,5 kg por semana para maximizar massa magra.`,
        metric: `${perWeek.toFixed(2)} kg/sem`,
      });
    }
  }

  // 6) PRs recentes
  const prs = sessions
    .filter((s) => s.status === "completed")
    .flatMap((s) =>
      s.items.flatMap((item) =>
        item.sets.filter((set) => set.isPr).map(() => item.exerciseName),
      ),
    );
  if (prs.length > 0) {
    insights.push({
      id: "pr",
      tone: "positive",
      category: "Recordes",
      title: `${prs.length} ${prs.length === 1 ? "novo recorde" : "novos recordes"}`,
      body: `Batendo recorde em ${Array.from(new Set(prs)).slice(0, 3).join(", ")}. Registre isso: PRs são a métrica mais honesta de progresso.`,
      metric: `${prs.length} PRs`,
    });
  }

  // 7) Sessões abandonadas
  const abandoned = sessions.filter((s) => s.status === "abandoned").length;
  if (abandoned >= 2) {
    insights.push({
      id: "abandoned",
      tone: "info",
      category: "Hábito",
      title: `${abandoned} treinos não finalizados`,
      body: "Sessões inacabadas costumam ser fadiga ou rotina irrealista. Tente reduzir o volume da ficha em ~20% por uma semana.",
      metric: `${abandoned}`,
    });
  }

  // 8) Sem treino recente
  if (completed.length > 0) {
    const last = completed.reduce((a, b) => (a.startedAt > b.startedAt ? a : b));
    const gap = daysBetween(startOfDay(last.startedAt), startOfDay());
    if (gap >= 4) {
      insights.push({
        id: "inactive",
        tone: "warning",
        category: "Hábito",
        title: `${gap} dias sem treinar`,
        body: "O tempo de volta depois de uma pausa é maior do que parece. Faça hoje uma sessão curta de 20 minutos — só isso quebra o padrão.",
        action: { label: "Treinar agora", href: "/treinos" },
        metric: `${gap} dias`,
      });
    }
  }

  return insights;
}
