/**
 * Cardio ao ar livre.
 *
 * Atividades ficam em uma agenda própria, independente das fichas de força,
 * para que caminhadas, corridas e pedaladas possam ocupar também os dias de
 * descanso sem transformar o treino em uma sessão de academia.
 */

export const CARDIO_ACTIVITIES = [
  "walk",
  "run",
  "hike",
  "cycle",
  "other",
] as const;
export type CardioActivity = (typeof CARDIO_ACTIVITIES)[number];

export const CARDIO_ACTIVITY_META: Record<
  CardioActivity,
  {
    label: string;
    body: string;
    met: number;
    distanceLabel?: string;
  }
> = {
  walk: {
    label: "Caminhada",
    body: "Ritmo constante, conversa possível.",
    met: 3.8,
    distanceLabel: "Distância",
  },
  run: {
    label: "Corrida",
    body: "Passadas leves, respiração presente.",
    met: 8.3,
    distanceLabel: "Distância",
  },
  hike: {
    label: "Trilha",
    body: "Terreno irregular e contato com a natureza.",
    met: 5.6,
    distanceLabel: "Distância",
  },
  cycle: {
    label: "Pedal",
    body: "Baixo impacto, ritmo do seu jeito.",
    met: 6.8,
    distanceLabel: "Distância",
  },
  other: {
    label: "Outro",
    body: "Natação, escada, dança ou o que mover você.",
    met: 5,
  },
};

export const CARDIO_INTENSITIES = ["light", "moderate", "vigorous"] as const;
export type CardioIntensity = (typeof CARDIO_INTENSITIES)[number];

export const CARDIO_INTENSITY_LABELS: Record<CardioIntensity, string> = {
  light: "Leve",
  moderate: "Moderada",
  vigorous: "Forte",
};

export const CARDIO_STATUSES = ["planned", "completed"] as const;
export type CardioStatus = (typeof CARDIO_STATUSES)[number];

/** Estimativa de gasto energético para dar contexto, não para compensar comida. */
export function estimateCardioCalories(input: {
  activity: CardioActivity;
  intensity: CardioIntensity;
  minutes: number;
  weightKg?: number | null;
}): number {
  const weight = input.weightKg && input.weightKg > 0 ? input.weightKg : 70;
  const intensityFactor =
    input.intensity === "light" ? 0.82 : input.intensity === "vigorous" ? 1.18 : 1;
  const met = CARDIO_ACTIVITY_META[input.activity].met * intensityFactor;
  return Math.max(
    0,
    Math.round(((met * 3.5 * weight) / 200) * Math.max(0, input.minutes)),
  );
}

export function activityLabel(activity: string): string {
  return (
    CARDIO_ACTIVITY_META[activity as CardioActivity]?.label ??
    "Cardio ao ar livre"
  );
}

export function intensityLabel(intensity: string): string {
  return (
    CARDIO_INTENSITY_LABELS[intensity as CardioIntensity] ?? "Moderada"
  );
}

/** "6,2 km" — só mostra quando existe distância registrada. */
export function formatDistance(distanceKm: number | null | undefined): string | null {
  if (distanceKm === null || distanceKm === undefined || distanceKm <= 0) {
    return null;
  }
  return `${distanceKm.toLocaleString("pt-BR", {
    minimumFractionDigits: distanceKm % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })} km`;
}
