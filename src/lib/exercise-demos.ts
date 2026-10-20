/**
 * Mídias gratuitas da biblioteca de exercícios.
 *
 * A hierarquia é intencional:
 *   1. MuscleWiki (quando configurado) — vídeo licenciado, prioridade máxima.
 *   2. Your Move — vídeos gratuitos, verticais e com boa qualidade.
 *   3. ExerciseDB Free — animações de 180 px, exibidas como estudo compacto.
 *
 * Os arquivos ficam em `public/demos`; assim o app não depende de hotlinks e
 * funciona offline depois que a mídia é carregada. Os créditos e as licenças
 * estão em `CREDITS.md` e no README.
 */

export type ExerciseMediaVideo = {
  angle: string;
  gender: string;
  src: string;
  poster: string | null;
};

export type ExerciseMediaData =
  | {
      kind: "video";
      provider: "musclewiki" | "ymove";
      videos: ExerciseMediaVideo[];
      sourceName: string | null;
      sourceUrl: string;
      variantNote: string | null;
      orientation: "portrait" | "landscape";
    }
  | {
      kind: "gif";
      provider: "exercisedb";
      src: string;
      sourceName: string;
      sourceUrl: string;
      license: string;
      licenseUrl: string;
      variantNote: string | null;
      width: number;
      height: number;
    };

export type YmoveDemo = {
  /** Arquivo local em `public/demos/ymove`. */
  src: string;
  /** Frame extraído do próprio vídeo para evitar um primeiro frame preto. */
  poster: string;
  /** Nome do movimento no catálogo original. */
  sourceTitle: string;
  /** Observação quando o vídeo é uma variação do exercício do Forma. */
  variantNote?: string;
};

export type ExerciseDbDemo = {
  /** GIF local em `public/demos/exercisedb`. */
  src: string;
  /** Nome do movimento no catálogo original. */
  sourceTitle: string;
  /** Observação quando a animação é uma variação do exercício do Forma. */
  variantNote?: string;
};

/**
 * Vídeos do Your Move usados no Forma.
 *
 * São clipes verticais de 720 × 1280, com uma pessoa e fundo neutro. O catálogo
 * gratuito tem 25 movimentos; aqui entram apenas os que têm relação clara com
 * a biblioteca do Forma. Variações de equipamento são sinalizadas na interface.
 */
export const YMOVE_DEMOS: Record<string, YmoveDemo> = {
  "elevacao-lateral-halter": {
    src: "/demos/ymove/elevacao-lateral-halter.mp4",
    poster: "/demos/ymove/elevacao-lateral-halter.jpg",
    sourceTitle: "Dumbbell Lateral Raise",
  },
  "curl-martelo": {
    src: "/demos/ymove/curl-martelo.mp4",
    poster: "/demos/ymove/curl-martelo.jpg",
    sourceTitle: "Hammer Curls",
  },
  "remada-unilateral-halter": {
    src: "/demos/ymove/remada-unilateral-halter.mp4",
    poster: "/demos/ymove/remada-unilateral-halter.jpg",
    sourceTitle: "Single Arm Dumbbell Row - Legs apart",
    variantNote:
      "O vídeo usa uma base mais aberta. Mantenha o tronco estável e puxe o haltere em direção ao quadril.",
  },
  "agachamento-goblet": {
    src: "/demos/ymove/agachamento-goblet.mp4",
    poster: "/demos/ymove/agachamento-goblet.jpg",
    sourceTitle: "Dumbbell Goblet Squat",
  },
  "puxada-na-frente": {
    src: "/demos/ymove/puxada-na-frente.mp4",
    poster: "/demos/ymove/puxada-na-frente.jpg",
    sourceTitle: "Lat Pulldown",
  },
  "remada-cabo": {
    src: "/demos/ymove/remada-cabo.mp4",
    poster: "/demos/ymove/remada-cabo.jpg",
    sourceTitle: "Seated Cable Row close V bar",
    variantNote:
      "O vídeo usa o puxador V. Mantenha os cotovelos próximos ao tronco e a coluna neutra.",
  },
  "triceps-cabo": {
    src: "/demos/ymove/triceps-cabo.mp4",
    poster: "/demos/ymove/triceps-cabo.jpg",
    sourceTitle: "Cable Tricep Pushdown",
  },
  "face-pull-elastico": {
    src: "/demos/ymove/face-pull-elastico.mp4",
    poster: "/demos/ymove/face-pull-elastico.jpg",
    sourceTitle: "Cable Rope Face Pull",
    variantNote:
      "O vídeo é feito na polia. Com a faixa, fixe o elástico na altura do rosto e reproduza o mesmo puxamento.",
  },
  "flexao-de-halteres": {
    src: "/demos/ymove/flexao-de-halteres.mp4",
    poster: "/demos/ymove/flexao-de-halteres.jpg",
    sourceTitle: "Barbell Bench Press",
    variantNote:
      "O vídeo usa barra. Com halteres, mantenha os punhos firmes e os cotovelos em um ângulo confortável.",
  },
  "terra-romeno": {
    src: "/demos/ymove/terra-romeno.mp4",
    poster: "/demos/ymove/terra-romeno.jpg",
    sourceTitle: "Kettlebell Romanian Deadlift",
    variantNote:
      "O vídeo usa kettlebell. Com barra ou halteres, mantenha a carga próxima às pernas e a lombar neutra.",
  },
  "abertura-peito-halteres": {
    src: "/demos/ymove/abertura-peito-halteres.mp4",
    poster: "/demos/ymove/abertura-peito-halteres.jpg",
    sourceTitle: "Cable Crossover (Mid)",
    variantNote:
      "O vídeo é na polia. Com halteres, mantenha uma leve flexão nos cotovelos e uma amplitude confortável.",
  },
  "curl-elastico": {
    src: "/demos/ymove/curl-elastico.mp4",
    poster: "/demos/ymove/curl-elastico.jpg",
    sourceTitle: "Cable Bicep Curl rope",
    variantNote:
      "O vídeo é na polia. Com a faixa, mantenha os cotovelos junto ao tronco e controle a volta.",
  },
  "triceps-alto-halter": {
    src: "/demos/ymove/triceps-alto-halter.mp4",
    poster: "/demos/ymove/triceps-alto-halter.jpg",
    sourceTitle: "Overhead Cable Rope Extension",
    variantNote:
      "O vídeo é na polia. Com o halter, mantenha os cotovelos apontados para cima e evite arquear a lombar.",
  },
  "glute-kickback": {
    src: "/demos/ymove/glute-kickback.mp4",
    poster: "/demos/ymove/glute-kickback.jpg",
    sourceTitle: "Glute Kickback Machine",
    variantNote:
      "O vídeo é na máquina. No chão, mantenha o quadril nivelado e evite girar o tronco.",
  },
};

/**
 * Animações do ExerciseDB Free.
 *
 * Licença de uso não comercial, com atribuição. O formato é 180 × 180 e por
 * isso a interface trata cada peça como um pequeno estudo de movimento, nunca
 * como um vídeo principal. Para uma publicação comercial, desligue
 * `EXERCISEDB_FREE_ENABLED` e mantenha apenas os vídeos do Your Move.
 */
export const EXERCISEDB_DEMOS: Record<string, ExerciseDbDemo> = {
  "barra-puxada": {
    src: "/demos/exercisedb/barra-puxada.gif",
    sourceTitle: "Pull-Up (Neutral Grip)",
    variantNote:
      "A animação usa pegada neutra. Use a pegada da sua barra e mantenha o core ativo.",
  },
  burpee: {
    src: "/demos/exercisedb/burpee.gif",
    sourceTitle: "burpee",
  },
  "escadaria-burpee": {
    src: "/demos/exercisedb/escadaria-burpee.gif",
    sourceTitle: "burpee",
    variantNote:
      "A animação mostra o burpee base. A escada é uma progressão de volume e intensidade.",
  },
  "dead-bug": {
    src: "/demos/exercisedb/dead-bug.gif",
    sourceTitle: "dead bug",
  },
  bicicleta: {
    src: "/demos/exercisedb/bicicleta.gif",
    sourceTitle: "Bicycle Crunch",
  },
  "mountain-climber": {
    src: "/demos/exercisedb/mountain-climber.gif",
    sourceTitle: "mountain climber",
  },
  "pular-corda": {
    src: "/demos/exercisedb/pular-corda.gif",
    sourceTitle: "jump rope",
  },
  skater: {
    src: "/demos/exercisedb/skater.gif",
    sourceTitle: "skater hops",
    variantNote:
      "A animação mostra saltos laterais. Reduza a amplitude se precisar controlar o impacto.",
  },
  "flexao-inclinada": {
    src: "/demos/exercisedb/flexao-inclinada.gif",
    sourceTitle: "incline push-up",
  },
  "triceps-close-grip": {
    src: "/demos/exercisedb/triceps-close-grip.gif",
    sourceTitle: "close-grip push-up",
  },
  "step-up": {
    src: "/demos/exercisedb/step-up.gif",
    sourceTitle: "dumbbell step-up",
    variantNote:
      "A animação usa halteres. A altura do banco é o fator principal; ajuste a carga depois.",
  },
  "peso-morto-unilateral": {
    src: "/demos/exercisedb/peso-morto-unilateral.gif",
    sourceTitle: "dumbbell single leg deadlift",
    variantNote:
      "A animação usa halter. Mantenha o quadril nivelado e o pé de apoio firme.",
  },
  "panturrilha-em-pe": {
    src: "/demos/exercisedb/panturrilha-em-pe.gif",
    sourceTitle: "bodyweight standing calf raise",
  },
  "panturrilha-sentado": {
    src: "/demos/exercisedb/panturrilha-sentado.gif",
    sourceTitle: "Machine Seated Calf Raise",
    variantNote:
      "A animação é na máquina. Use a carga que permita uma amplitude completa e controlada.",
  },
  "glute-bridge": {
    src: "/demos/exercisedb/glute-bridge.gif",
    sourceTitle: "low glute bridge on floor",
    variantNote:
      "A animação mostra uma variação baixa. Suba até a linha do quadril sem arquear a lombar.",
  },
  "good-morning": {
    src: "/demos/exercisedb/good-morning.gif",
    sourceTitle: "barbell good morning",
    variantNote:
      "A animação usa barra. Reduza a carga se a lombar perder o neutro.",
  },
  "elevacao-frontal-halter": {
    src: "/demos/exercisedb/elevacao-frontal-halter.gif",
    sourceTitle: "dumbbell front raise",
  },
  "antebraco-punho": {
    src: "/demos/exercisedb/antebraco-punho.gif",
    sourceTitle: "dumbbell seated palms up wrist curl",
    variantNote:
      "A animação é sentada com halteres. Mantenha o antebraço apoiado e o punho alinhado.",
  },
  "triceps-kickback": {
    src: "/demos/exercisedb/triceps-kickback.gif",
    sourceTitle: "Dumbbell Standing Alternating Triceps Kickback",
    variantNote:
      "A animação é alternada. Mantenha o cotovelo fixo ao lado do tronco.",
  },
  "agachamento-sumo": {
    src: "/demos/exercisedb/agachamento-sumo.gif",
    sourceTitle: "smith sumo squat",
    variantNote:
      "A animação é no Smith. Mantenha a base ampla e os joelhos alinhados aos pés.",
  },
  afundo: {
    src: "/demos/exercisedb/afundo.gif",
    sourceTitle: "barbell rear lunge",
    variantNote:
      "A animação usa passo para trás com barra. Adapte para o passo à frente se a sua ficha pedir.",
  },
  "prancha-lateral": {
    src: "/demos/exercisedb/prancha-lateral.gif",
    sourceTitle: "Side Plank Hip Abduction",
    variantNote:
      "A animação inclui elevação do quadril. Mantenha o corpo alinhado e o apoio firme.",
  },
  "caminhada-do-fazendeiro": {
    src: "/demos/exercisedb/caminhada-do-fazendeiro.gif",
    sourceTitle: "farmers walk",
  },
  "worlds-greatest-stretch": {
    src: "/demos/exercisedb/worlds-greatest-stretch.gif",
    sourceTitle: "world greatest stretch",
  },
  "desenvolvimento-halter": {
    src: "/demos/exercisedb/desenvolvimento-halter.gif",
    sourceTitle: "Alternating Seated Dumbbell Shoulder Press",
    variantNote:
      "A animação é sentada e alternada. Mantenha as costelas alinhadas e o core ativo.",
  },
};

export function getYmoveDemo(slug: string): YmoveDemo | null {
  return YMOVE_DEMOS[slug] ?? null;
}

export function getExerciseDbDemo(slug: string): ExerciseDbDemo | null {
  return EXERCISEDB_DEMOS[slug] ?? null;
}
