/**
 * Termos de busca usados para encontrar a demonstração correspondente na API
 * oficial da MuscleWiki. São apenas consultas em inglês — o conteúdo em
 * português exibido no app continua sendo o nosso.
 */
export const MUSCLEWIKI_QUERIES: Record<string, string> = {
  "flexao-de-barra": "push-up",
  "flexao-inclinada": "incline push-up",
  "flexao-de-halteres": "dumbbell bench press",
  "flexao-cobra": "cobra stretch",
  "abertura-peito-halteres": "dumbbell fly",
  "barra-puxada": "pull-up",
  "puxada-na-frente": "lat pulldown",
  "remada-com-elastico": "band row",
  "remada-unilateral-halter": "dumbbell row",
  "remada-cabo": "cable row",
  superman: "superman",
  "elevacao-lateral-halter": "lateral raise",
  "desenvolvimento-halter": "dumbbell shoulder press",
  "flexao-pike": "pike push-up",
  "face-pull-elastico": "face pull",
  "elevacao-frontal-halter": "front raise",
  "curl-halter": "dumbbell curl",
  "curl-martelo": "hammer curl",
  "curl-elastico": "band curl",
  "antebraco-punho": "wrist curl",
  "caminhada-do-fazendeiro": "farmer's walk",
  "triceps-alto-halter": "overhead triceps extension",
  "triceps-close-grip": "close-grip push-up",
  "triceps-kickback": "triceps kickback",
  "triceps-cabo": "cable triceps pushdown",
  prancha: "plank",
  "dead-bug": "dead bug",
  "hollow-hold": "hollow hold",
  bicicleta: "bicycle crunch",
  "bird-dog": "bird dog",
  "prancha-lateral": "side plank",
  "mountain-climber": "mountain climber",
  "agachamento-goblet": "goblet squat",
  "agachamento-sumo": "sumo squat",
  "agachamento-isometrico-parede": "wall sit",
  afundo: "lunge",
  "agachamento-curtsy": "curtsy lunge",
  "agachamento-bulgarian": "bulgarian split squat",
  "step-up": "step-up",
  "glute-bridge": "glute bridge",
  "hip-thrust": "hip thrust",
  "glute-kickback": "glute kickback",
  clamshell: "clamshell",
  "peso-morto-unilateral": "single-leg deadlift",
  "terra-romeno": "romanian deadlift",
  "nordic-curl": "nordic curl",
  "panturrilha-em-pe": "standing calf raise",
  "panturrilha-sentado": "seated calf raise",
  "jumping-jack": "jumping jack",
  "agachamento-alto": "high knees",
  "pular-corda": "jump rope",
  skater: "skater",
  burpee: "burpee",
  "escadaria-burpee": "burpee",
  "box-jump": "box jump",
  hundred: "hundred",
  "roll-up": "roll-up",
  "cat-cow": "cat cow",
  "ninety-ninety": "ninety ninety",
  "worlds-greatest-stretch": "world's greatest stretch",
  "flexor-de-quadril": "hip flexor stretch",
  "rotacao-toracica": "thoracic rotation",
  "respiracao-caixa": "box breathing",
  "respiracao-478": "4-7-8 breathing",
  "downward-dog": "downward dog",
  "pose-da-arvore": "tree pose",
  "good-morning": "good morning",
  "corrida-no-lugar": "jog in place",
};

/** Fallback para exercícios novos: usa o termo em inglês entre parênteses. */
export function getMuscleWikiQuery(name: string, slug?: string): string {
  if (slug && MUSCLEWIKI_QUERIES[slug]) return MUSCLEWIKI_QUERIES[slug];

  const parenthetical = name.match(/\(([^)]+)\)\s*$/)?.[1]?.trim();
  if (parenthetical && /^[a-zA-Z0-9\s'’-]+$/.test(parenthetical)) {
    return parenthetical;
  }

  return name;
}
