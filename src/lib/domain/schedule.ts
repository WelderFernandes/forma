/**
 * Agenda semanal do Forma.
 *
 * Dias são persistidos como números ISO: 1 = segunda ... 7 = domingo.
 * Isso mantém a leitura estável independentemente do fuso do navegador
 * (Date#getDay devolve 0 para domingo).
 */

export const WEEKDAYS = [
  { value: 1, short: "seg", label: "Segunda", full: "Segunda-feira" },
  { value: 2, short: "ter", label: "Terça", full: "Terça-feira" },
  { value: 3, short: "qua", label: "Quarta", full: "Quarta-feira" },
  { value: 4, short: "qui", label: "Quinta", full: "Quinta-feira" },
  { value: 5, short: "sex", label: "Sexta", full: "Sexta-feira" },
  { value: 6, short: "sáb", label: "Sábado", full: "Sábado" },
  { value: 7, short: "dom", label: "Domingo", full: "Domingo" },
] as const;

export type Weekday = (typeof WEEKDAYS)[number]["value"];

export const WEEKDAY_VALUES = WEEKDAYS.map((day) => day.value);

/** Distribuição inicial recomendada para cada frequência (2 a 6 dias). */
export const DEFAULT_TRAINING_DAYS: Record<number, Weekday[]> = {
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
};

export function isWeekday(value: unknown): value is Weekday {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 7
  );
}

/**
 * Ajusta a seleção para a frequência escolhida sem perder dias já marcados.
 * Se o usuário reduzir a frequência, mantém os primeiros dias selecionados;
 * se aumentar, completa com a distribuição recomendada.
 */
export function fitTrainingDays(
  current: readonly number[] | null | undefined,
  daysPerWeek: number,
): Weekday[] {
  const target = Math.max(2, Math.min(6, Math.round(daysPerWeek || 3)));
  const selected = Array.from(new Set((current ?? []).filter(isWeekday))).sort(
    (a, b) => a - b,
  ) as Weekday[];

  if (selected.length === target) return selected;
  if (selected.length > target) return selected.slice(0, target);

  const result = [...selected];
  const recommended = DEFAULT_TRAINING_DAYS[target] ?? [1, 3, 5];

  for (const day of recommended) {
    if (result.length >= target) break;
    if (!result.includes(day)) result.push(day);
  }

  for (const day of WEEKDAY_VALUES) {
    if (result.length >= target) break;
    if (!result.includes(day)) result.push(day);
  }

  return result.sort((a, b) => a - b) as Weekday[];
}

/** Lê o JSON salvo no perfil e devolve uma agenda consistente. */
export function normalizeTrainingDays(
  raw: string | readonly number[] | null | undefined,
  daysPerWeek: number,
): Weekday[] {
  let values: number[] = [];

  if (Array.isArray(raw)) {
    values = raw as number[];
  } else if (typeof raw === "string" && raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) values = parsed as number[];
    } catch {
      values = [];
    }
  }

  return fitTrainingDays(values, daysPerWeek);
}

/** "seg, qua e sex" — compacto o bastante para chips e cartões. */
export function formatTrainingDays(
  days: readonly number[],
  style: "short" | "full" = "short",
): string {
  const valid = Array.from(new Set(days.filter(isWeekday))).sort(
    (a, b) => a - b,
  );
  if (valid.length === 0) return "nenhum dia";

  const labels = valid.map((day) => {
    const option = WEEKDAYS.find((item) => item.value === day);
    return style === "full" ? option?.full : option?.short;
  });

  if (labels.length === 1) return labels[0] ?? "";
  if (labels.length === 2) return `${labels[0]} e ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")} e ${labels.at(-1)}`;
}

/** Número ISO do dia (1 = segunda ... 7 = domingo). */
export function isoWeekday(date: Date): Weekday {
  const day = date.getDay();
  return (day === 0 ? 7 : day) as Weekday;
}

/** Segunda-feira da semana da data, à meia-noite local. */
export function startOfWeek(date: Date = new Date()): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - (isoWeekday(copy) - 1));
  return copy;
}

export function isTrainingDay(days: readonly number[], date: Date): boolean {
  return days.includes(isoWeekday(date));
}

/** Próximo dia de treino a partir de hoje (inclui hoje). */
export function nextTrainingDate(
  days: readonly number[],
  from: Date = new Date(),
): Date | null {
  if (days.length === 0) return null;
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < 8; offset += 1) {
    const candidate = new Date(start);
    candidate.setDate(start.getDate() + offset);
    if (isTrainingDay(days, candidate)) return candidate;
  }

  return null;
}

export function weekdayLabel(value: number, style: "short" | "full" = "short") {
  const option = WEEKDAYS.find((day) => day.value === value);
  if (!option) return "";
  return style === "full" ? option.full : option.label;
}
