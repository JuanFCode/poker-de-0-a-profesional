/**
 * La ruta completa de 0 a profesional.
 *
 * Este fichero es la única fuente de verdad: de aquí salen la navegación, la
 * página de la ruta, el progreso guardado y las rutas estáticas del curso.
 */

export interface Lesson {
  slug: string;
  title: string;
  /** Una frase: qué te llevas de la lección. */
  summary: string;
  minutes: number;
  /** Herramienta con la que se practica lo que acabas de leer. */
  practice?: { href: string; label: string };
}

export interface Module {
  slug: string;
  /** Número que se ve en pantalla ("Fase 2"). */
  index: number;
  title: string;
  tagline: string;
  goal: string;
  duration: string;
  lessons: Lesson[];
}

export const CURRICULUM: Module[] = [
  {
    slug: "reglas",
    index: 0,
    title: "Las reglas",
    tagline: "Sentarte a una mesa sin perderte",
    goal: "Saber qué pasa en cada mano, qué gana a qué y cuándo te toca hablar.",
    duration: "1 semana",
    lessons: [
      {
        slug: "como-se-juega",
        title: "Cómo se juega una mano",
        summary: "Ciegas, cartas, las cuatro calles y las cinco acciones posibles.",
        minutes: 6,
      },
      {
        slug: "ranking-de-manos",
        title: "Las 10 manos y sus desempates",
        summary: "De carta alta a escalera real, y qué pasa cuando dos jugadores llevan lo mismo.",
        minutes: 7,
        practice: { href: "/herramientas/quiz", label: "Quiz de reglas" },
      },
      {
        slug: "la-mesa",
        title: "La mesa por dentro",
        summary: "Botón, ciegas y las nueve posiciones con sus nombres reales.",
        minutes: 5,
        practice: { href: "/herramientas/mesa", label: "Mesa interactiva" },
      },
      {
        slug: "errores-de-principiante",
        title: "Los 7 errores del principiante",
        summary: "Lo que separa a quien pierde de quien todavía no gana.",
        minutes: 6,
      },
    ],
  },
  {
    slug: "preflop",
    index: 1,
    title: "Preflop",
    tagline: "El 80% de tus beneficios se decide antes del flop",
    goal: "Saber con qué manos entras al bote desde cada silla, y con cuáles no.",
    duration: "2-3 semanas",
    lessons: [
      {
        slug: "la-posicion-manda",
        title: "La posición manda",
        summary: "Por qué la misma mano vale el doble desde el botón que desde UTG.",
        minutes: 6,
        practice: { href: "/herramientas/mesa", label: "Mesa interactiva" },
      },
      {
        slug: "rangos-de-apertura",
        title: "Rangos de apertura",
        summary: "Qué abres desde cada posición y cómo memorizarlo sin fichas.",
        minutes: 8,
        practice: { href: "/herramientas/rangos", label: "Entrenador de rangos" },
      },
      {
        slug: "suited-vs-offsuit",
        title: "Suited manda",
        summary: "Por qué K-8s se abre desde UTG y K-8o no se abre ni desde el botón.",
        minutes: 6,
        practice: { href: "/herramientas/rangos", label: "Entrenador de rangos" },
      },
      {
        slug: "cuando-ya-han-subido",
        title: "Cuando ya han subido",
        summary: "Resubir, igualar o tirar: la decisión que aparece en cuatro manos de cada cinco.",
        minutes: 9,
        practice: { href: "/herramientas/rangos", label: "Entrenador de rangos" },
      },
      {
        slug: "limpers-e-isolar",
        title: "Limpers: cómo se castiga al que iguala",
        summary: "El iso-raise, el tamaño correcto y por qué el limper es tu mejor cliente.",
        minutes: 7,
        practice: { href: "/herramientas/rangos", label: "Entrenador de rangos" },
      },
      {
        slug: "3-bet",
        title: "3-bet: resubir",
        summary: "Value y farol, tamaños, y por qué resubir gana más que igualar.",
        minutes: 8,
        practice: { href: "/herramientas/rangos", label: "Entrenador de rangos" },
      },
      {
        slug: "squeeze-y-4-bet",
        title: "Squeeze y 4-bet",
        summary: "Resubir sobre un open con caller, y qué hacer cuando te resuben a ti.",
        minutes: 8,
        practice: { href: "/herramientas/rangos", label: "Entrenador de rangos" },
      },
      {
        slug: "defender-las-ciegas",
        title: "Defender las ciegas",
        summary: "Ya has puesto dinero: cuánto defender sin convertirlo en una fuga.",
        minutes: 7,
      },
      {
        slug: "ajustes",
        title: "Ajustar el rango",
        summary: "Stacks cortos, mesas flojas, rivales que nunca tiran: cuándo salirse de la tabla.",
        minutes: 7,
      },
    ],
  },
  {
    slug: "matematicas",
    index: 2,
    title: "Matemáticas de mesa",
    tagline: "Cuatro cuentas que puedes hacer en 5 segundos",
    goal: "Decidir por precio y no por corazonada.",
    duration: "2 semanas",
    lessons: [
      {
        slug: "pot-odds-y-outs",
        title: "Pot odds y outs",
        summary: "Cuánto te cuesta seguir, cuánto te pagan y la regla del 2 y el 4.",
        minutes: 8,
        practice: { href: "/herramientas/odds", label: "Calculadora de odds" },
      },
      {
        slug: "equity-y-rangos",
        title: "Equity contra rangos",
        summary: "Dejar de pensar en la mano del rival y empezar a pensar en todas sus manos.",
        minutes: 8,
        practice: { href: "/herramientas/odds", label: "Calculadora de equity" },
      },
      {
        slug: "ev",
        title: "EV: la única métrica",
        summary: "Cómo se calcula el valor esperado y por qué una buena decisión puede perder.",
        minutes: 7,
      },
      {
        slug: "frecuencias",
        title: "Frecuencias, faroles y MDF",
        summary: "Cuántas veces tiene que colar un farol y cuánto tienes que defender tú.",
        minutes: 8,
      },
    ],
  },
  {
    slug: "postflop",
    index: 3,
    title: "Postflop",
    tagline: "Donde se gana o se pierde de verdad",
    goal: "Tener un plan para el flop, el turn y el river antes de tocar las fichas.",
    duration: "3-4 semanas",
    lessons: [
      {
        slug: "leer-el-flop",
        title: "Leer el flop",
        summary: "Texturas secas y húmedas, y a quién favorece cada board.",
        minutes: 8,
      },
      {
        slug: "c-bet",
        title: "La continuación (c-bet)",
        summary: "Cuándo apostar el flop tras haber subido preflop, y de cuánto.",
        minutes: 8,
      },
      {
        slug: "botes-multiway",
        title: "Botes multiway",
        summary: "Tres o más jugadores: menos c-bets, casi ningún farol y otras manos.",
        minutes: 7,
      },
      {
        slug: "turn-y-river",
        title: "Turn y river",
        summary: "Segundo y tercer disparo: cuándo seguir, cuándo frenar y cuándo apostar grande.",
        minutes: 8,
      },
      {
        slug: "bluffs-y-blockers",
        title: "Faroles y blockers",
        summary: "Con qué manos farolear: las que bloquean lo que el rival necesita.",
        minutes: 7,
      },
      {
        slug: "tamanos",
        title: "Elegir el tamaño",
        summary: "1/3, 2/3 o all-in: el tamaño es un mensaje, no un capricho.",
        minutes: 6,
      },
      {
        slug: "spr-y-compromiso",
        title: "SPR: cuándo tu mano vale un stack",
        summary: "La división que decide si top pair es un monstruo o una mano media.",
        minutes: 8,
        practice: { href: "/herramientas/odds", label: "Calculadora de equity" },
      },
      {
        slug: "mano-comentada",
        title: "Una mano comentada de principio a fin",
        summary: "Todo lo anterior aplicado a una sola mano, calle por calle.",
        minutes: 9,
        practice: { href: "/herramientas/odds", label: "Comprueba la equity" },
      },
    ],
  },
  {
    slug: "bankroll",
    index: 4,
    title: "Bankroll y cabeza",
    tagline: "Lo que hace que sigas jugando dentro de un año",
    goal: "No quebrar y no jugar enfadado. Sin esto, la estrategia da igual.",
    duration: "Continuo",
    lessons: [
      {
        slug: "gestion-de-bankroll",
        title: "Gestión de bankroll",
        summary: "Cuántos buy-ins por formato y cuándo subes o bajas de nivel.",
        minutes: 7,
        practice: { href: "/herramientas/bankroll", label: "Tracker de bankroll" },
      },
      {
        slug: "varianza",
        title: "Varianza y downswings",
        summary: "Por qué un ganador puede perder 20 buy-ins seguidos sin hacer nada mal.",
        minutes: 7,
      },
      {
        slug: "tilt",
        title: "Tilt",
        summary: "Detectarlo antes de que te cueste dinero y tener una salida preparada.",
        minutes: 7,
      },
      {
        slug: "rutina-de-estudio",
        title: "Rutina de estudio",
        summary: "Cómo repartir las horas entre jugar, revisar y estudiar.",
        minutes: 6,
      },
    ],
  },
  {
    slug: "profesional",
    index: 5,
    title: "Nivel profesional",
    tagline: "Tratar el poker como un negocio",
    goal: "Elegir dónde juegas, medir si ganas y saber cuánto ganas por hora.",
    duration: "Continuo",
    lessons: [
      {
        slug: "el-rastrillo",
        title: "El rastrillo",
        summary: "Lo que la casa se lleva de cada bote, y cómo cierra tus rangos sin que lo notes.",
        minutes: 8,
      },
      {
        slug: "seleccion-de-mesa",
        title: "Selección de mesa y formato",
        summary: "El mejor ajuste estratégico es elegir contra quién juegas.",
        minutes: 7,
      },
      {
        slug: "medir-tu-juego",
        title: "Medir tu juego",
        summary: "bb/100, muestra mínima y las estadísticas que de verdad miras.",
        minutes: 8,
        practice: { href: "/herramientas/bankroll", label: "Tracker de bankroll" },
      },
      {
        slug: "gto-vs-explotativo",
        title: "GTO vs explotativo",
        summary: "Cuándo jugar equilibrado y cuándo desviarte para ganar más.",
        minutes: 8,
      },
      {
        slug: "poker-como-negocio",
        title: "El poker como negocio",
        summary: "Horas, ingresos, impuestos, rutina y el riesgo de vivir de esto.",
        minutes: 8,
      },
      {
        slug: "plan-12-semanas",
        title: "Tu plan de 12 semanas",
        summary: "Semana a semana: qué estudias, qué practicas y qué mides.",
        minutes: 8,
      },
    ],
  },
];

export const MODULE_BY_SLUG = new Map(CURRICULUM.map((module) => [module.slug, module]));

export interface LessonRef {
  module: Module;
  lesson: Lesson;
  /** Posición global dentro del curso, empezando en 1. */
  position: number;
  href: string;
}

export const ALL_LESSONS: LessonRef[] = CURRICULUM.flatMap((module) =>
  module.lessons.map((lesson) => ({
    module,
    lesson,
    position: 0,
    href: `/curso/${module.slug}/${lesson.slug}`,
  })),
).map((ref, index) => ({ ...ref, position: index + 1 }));

export const TOTAL_LESSONS = ALL_LESSONS.length;

export const TOTAL_MINUTES = ALL_LESSONS.reduce((sum, ref) => sum + ref.lesson.minutes, 0);

export function findLesson(moduleSlug: string, lessonSlug: string): LessonRef | undefined {
  return ALL_LESSONS.find(
    (ref) => ref.module.slug === moduleSlug && ref.lesson.slug === lessonSlug,
  );
}

export function neighbours(moduleSlug: string, lessonSlug: string) {
  const index = ALL_LESSONS.findIndex(
    (ref) => ref.module.slug === moduleSlug && ref.lesson.slug === lessonSlug,
  );
  return {
    previous: index > 0 ? ALL_LESSONS[index - 1] : null,
    next: index >= 0 && index < ALL_LESSONS.length - 1 ? ALL_LESSONS[index + 1] : null,
  };
}

export const lessonId = (moduleSlug: string, lessonSlug: string): string =>
  `${moduleSlug}/${lessonSlug}`;
