/**
 * Banco de preguntas del quiz.
 *
 * Cubre lo que hay que saber de memoria: el ranking de manos y sus desempates
 * (tal cual los define la guía oficial), el orden de juego, la posición, la
 * matemática básica y las reglas de bankroll.
 */

export type Topic = "Reglas" | "Ranking" | "Posición" | "Matemáticas" | "Preflop" | "Bankroll";

export interface Question {
  id: string;
  topic: Topic;
  question: string;
  options: string[];
  /** Índice de la opción correcta. */
  answer: number;
  explanation: string;
}

export const TOPICS: Topic[] = [
  "Reglas",
  "Ranking",
  "Posición",
  "Matemáticas",
  "Preflop",
  "Bankroll",
];

export const QUESTIONS: Question[] = [
  // ---------------------------------------------------------------- Ranking
  {
    id: "rank-orden-1",
    topic: "Ranking",
    question: "¿Qué mano gana?",
    options: ["Color", "Escalera", "Full", "Trío"],
    answer: 2,
    explanation: "El orden es trío < escalera < color < full. El full gana a las otras tres.",
  },
  {
    id: "rank-orden-2",
    topic: "Ranking",
    question: "¿Cuál es la mejor mano posible en Hold'em?",
    options: ["Póker de ases", "Escalera de color al rey", "Escalera real", "Full de ases"],
    answer: 2,
    explanation:
      "La escalera real (A-K-Q-J-10 del mismo palo) no se puede batir: es la escalera de color más alta.",
  },
  {
    id: "rank-color-vs-escalera",
    topic: "Ranking",
    question: "Color al 9 contra escalera al rey. ¿Quién gana?",
    options: ["El color", "La escalera", "Empatan", "Depende del palo"],
    answer: 0,
    explanation:
      "El color siempre gana a la escalera, por bajo que sea. Las categorías se comparan antes que las cartas.",
  },
  {
    id: "rank-kicker",
    topic: "Ranking",
    question: "Los dos tenéis pareja de ases. Tú A-K, él A-Q, board sin ayudar. ¿Quién gana?",
    options: ["Tú, por el kicker K", "Él, por el kicker Q", "Empate", "Gana quien hable primero"],
    answer: 0,
    explanation:
      "Con la misma pareja decide la carta de acompañamiento (kicker): K gana a Q. Por eso A-K vale mucho más que A-Q.",
  },
  {
    id: "rank-dos-parejas",
    topic: "Ranking",
    question: "Ambos tenéis exactamente la misma doble pareja. ¿Cómo se desempata?",
    options: [
      "Por el palo más alto",
      "Por la quinta carta (kicker)",
      "Se reparte siempre el bote",
      "Gana quien apostó último",
    ],
    answer: 1,
    explanation:
      "Si las dos parejas coinciden, decide la quinta carta. Solo si también coincide se reparte el bote.",
  },
  {
    id: "rank-rueda",
    topic: "Ranking",
    question: "A-2-3-4-5, ¿es escalera?",
    options: [
      "No, el as solo va arriba",
      "Sí, y es la escalera más baja",
      "Sí, y gana a 10-J-Q-K-A",
      "Solo si son del mismo palo",
    ],
    answer: 1,
    explanation:
      "Es la 'rueda': el as puede ir por debajo del 2. Es escalera al 5, la más baja de todas.",
  },
  {
    id: "rank-vuelta",
    topic: "Ranking",
    question: "Q-K-A-2-3, ¿es escalera?",
    options: ["Sí", "No, la escalera no da la vuelta", "Solo en torneos", "Solo si hay color"],
    answer: 1,
    explanation: "El as va arriba o abajo, pero la escalera nunca 'da la vuelta' pasando por el as.",
  },
  {
    id: "rank-palos",
    topic: "Ranking",
    question: "¿Qué palo vale más en Hold'em?",
    options: ["Picas", "Corazones", "Ninguno: todos valen igual", "El del botón"],
    answer: 2,
    explanation:
      "En Hold'em los palos no se ordenan. Si dos manos son idénticas en rango, el bote se reparte.",
  },
  {
    id: "rank-board-play",
    topic: "Ranking",
    question: "El board es A-K-Q-J-10 y ninguno de los dos liga nada mejor. ¿Qué pasa?",
    options: [
      "Gana el que tenga la carta más alta en mano",
      "Se reparte el bote",
      "Gana el que esté en posición",
      "Se anula la mano",
    ],
    answer: 1,
    explanation:
      "Ambos juegan las cinco cartas comunes: la misma mano exacta, así que se reparte el bote (split).",
  },
  {
    id: "rank-cuantas-cartas",
    topic: "Ranking",
    question: "¿Con cuántas cartas se forma tu mano final?",
    options: [
      "Con tus 2 cartas obligatoriamente",
      "Con las 5 mejores de las 7 disponibles",
      "Con las 7",
      "Con 5 del board siempre",
    ],
    answer: 1,
    explanation:
      "Eliges las 5 mejores entre tus 2 cartas y las 5 comunes. Puedes usar dos, una o ninguna de las tuyas.",
  },

  // ----------------------------------------------------------------- Reglas
  {
    id: "reglas-calles",
    topic: "Reglas",
    question: "¿Cuántas rondas de apuestas tiene una mano de Hold'em?",
    options: ["2", "3", "4", "5"],
    answer: 2,
    explanation: "Preflop, flop, turn y river. Cuatro rondas.",
  },
  {
    id: "reglas-flop",
    topic: "Reglas",
    question: "¿Cuántas cartas se reparten en el flop?",
    options: ["1", "2", "3", "5"],
    answer: 2,
    explanation: "Flop: 3 cartas. Turn: 1 más. River: la última. Cinco cartas comunes en total.",
  },
  {
    id: "reglas-orden-preflop",
    topic: "Reglas",
    question: "Preflop, ¿quién habla primero?",
    options: [
      "El botón",
      "La ciega pequeña",
      "El jugador a la izquierda de la ciega grande",
      "La ciega grande",
    ],
    answer: 2,
    explanation:
      "Preflop empieza el de la izquierda de la ciega grande (UTG), porque las ciegas ya han apostado.",
  },
  {
    id: "reglas-orden-postflop",
    topic: "Reglas",
    question: "Del flop en adelante, ¿quién habla primero?",
    options: [
      "El botón",
      "El primer jugador activo a la izquierda del botón",
      "El que ganó la mano anterior",
      "El que subió preflop",
    ],
    answer: 1,
    explanation:
      "Postflop el orden empieza por la izquierda del botón, así que el botón siempre habla el último: esa es su ventaja.",
  },
  {
    id: "reglas-acciones",
    topic: "Reglas",
    question: "Si nadie ha apostado en esta ronda, ¿qué NO puedes hacer?",
    options: ["Pasar (check)", "Apostar", "Igualar (call)", "Retirarte"],
    answer: 2,
    explanation:
      "No hay nada que igualar si nadie ha apostado. Puedes pasar o apostar (y retirarte, aunque sea tirar una mano gratis).",
  },
  {
    id: "reglas-allin",
    topic: "Reglas",
    question: "Vas all-in con menos fichas que la apuesta del rival. ¿Qué ocurre?",
    options: [
      "Pierdes la mano automáticamente",
      "Se crea un bote paralelo (side pot) y solo optas al principal",
      "Tienes que igualar o retirarte",
      "El rival recupera la diferencia y sigue la mano",
    ],
    answer: 1,
    explanation:
      "Optas al bote hasta donde llegan tus fichas. El resto se juega en un bote paralelo entre los demás.",
  },
  {
    id: "reglas-min-raise",
    topic: "Reglas",
    question: "El rival sube a 6. ¿Cuál es la subida mínima que puedes hacer tú?",
    options: ["A 8", "A 10", "A 12", "A 18"],
    answer: 1,
    explanation:
      "La subida mínima iguala el tamaño del último incremento: subió 4 sobre la ciega de 2, así que tu mínimo es 6 + 4 = 10.",
  },
  {
    id: "reglas-showdown",
    topic: "Reglas",
    question: "En el showdown, ¿quién enseña primero?",
    options: [
      "El que ganó la mano anterior",
      "El último que apostó o subió en el river",
      "El botón",
      "Todos a la vez",
    ],
    answer: 1,
    explanation:
      "Enseña primero el último agresor. Si nadie apostó en el river, empieza el primero en orden de posición.",
  },
  {
    id: "reglas-mostrar",
    topic: "Reglas",
    question: "Te retiras en el river. ¿Estás obligado a enseñar tus cartas?",
    options: [
      "Sí, siempre",
      "No: quien se retira nunca enseña",
      "Solo si te lo pide el rival",
      "Solo en torneos",
    ],
    answer: 1,
    explanation:
      "Al retirarte tus cartas van al muerto sin verse. La información es tuya: no la regales.",
  },
  {
    id: "reglas-ciegas",
    topic: "Reglas",
    question: "¿Qué son las ciegas?",
    options: [
      "Apuestas obligatorias que ponen los dos jugadores a la izquierda del botón",
      "Una apuesta voluntaria del botón",
      "La comisión de la sala",
      "El premio de la mano",
    ],
    answer: 0,
    explanation:
      "Ciega pequeña y ciega grande se ponen antes de ver cartas. Sin ellas nadie tendría motivo para jugar una mano.",
  },

  // --------------------------------------------------------------- Posición
  {
    id: "pos-mejor",
    topic: "Posición",
    question: "¿Cuál es la mejor posición de la mesa?",
    options: ["UTG", "Cutoff", "Botón", "Ciega grande"],
    answer: 2,
    explanation:
      "El botón habla el último en todas las calles postflop. Ver actuar a los demás antes de decidir es la mayor ventaja del juego.",
  },
  {
    id: "pos-utg",
    topic: "Posición",
    question: "¿Qué significa UTG?",
    options: [
      "El jugador con más fichas",
      "El primero en hablar preflop",
      "El que reparte",
      "El último en hablar",
    ],
    answer: 1,
    explanation:
      "'Under the gun': abre el fuego con 8 jugadores por detrás. Por eso su rango es el más estrecho.",
  },
  {
    id: "pos-cutoff",
    topic: "Posición",
    question: "¿Dónde se sienta el cutoff?",
    options: [
      "Justo a la derecha del botón",
      "Justo a la izquierda del botón",
      "Al lado de la ciega grande",
      "Enfrente del botón",
    ],
    answer: 0,
    explanation: "El cutoff es la silla anterior al botón. Es la segunda mejor posición de la mesa.",
  },
  {
    id: "pos-sb",
    topic: "Posición",
    question: "¿Por qué la ciega pequeña es la peor posición postflop?",
    options: [
      "Porque pone menos dinero",
      "Porque habla primero en todas las calles postflop",
      "Porque recibe peores cartas",
      "Porque no puede subir",
    ],
    answer: 1,
    explanation:
      "Jugarás toda la mano sin información. Por eso desde SB se sube o se tira: igualar es una fuga clásica.",
  },
  {
    id: "pos-rango",
    topic: "Posición",
    question: "¿Cómo cambia tu rango de apertura según avanzas de posición?",
    options: [
      "Se estrecha",
      "Se ensancha",
      "No cambia",
      "Se ensancha solo con stacks cortos",
    ],
    answer: 1,
    explanation:
      "Menos gente por detrás = menos posibilidades de encontrar una mano mejor. Por eso el botón abre casi el 45% y UTG menos del 10%.",
  },

  // ----------------------------------------------------------- Matemáticas
  {
    id: "mat-potodds-1",
    topic: "Matemáticas",
    question: "Hay 100 en el bote y el rival apuesta 50. ¿Qué equity necesitas para igualar?",
    options: ["25%", "33%", "50%", "66%"],
    answer: 0,
    explanation:
      "Con su apuesta hay 150 y tú pagas 50: te llevarías 200. 50/200 = 25%. Con más de un 25% de equity, igualar gana dinero.",
  },
  {
    id: "mat-potodds-2",
    topic: "Matemáticas",
    question: "El rival apuesta el tamaño del bote. ¿Cuánta equity necesitas para igualar?",
    options: ["25%", "33%", "50%", "66%"],
    answer: 1,
    explanation:
      "Bote 100 y apuesta 100: pagas 100 para llevarte 200. 100/(100+100+100) = 33%. Una apuesta de bote siempre pide un tercio.",
  },
  {
    id: "mat-regla24",
    topic: "Matemáticas",
    question: "Tienes proyecto de color en el flop (9 outs). ¿Qué probabilidad tienes de ligarlo?",
    options: ["Un 18%", "Un 35%", "Un 50%", "Un 65%"],
    answer: 1,
    explanation:
      "Regla del 4: 9 outs x 4 ≈ 36%, y el valor real es 35%. Desde el turn se multiplica por 2: ~19%.",
  },
  {
    id: "mat-outs-color",
    topic: "Matemáticas",
    question: "¿Cuántos outs tiene un proyecto de color con cuatro cartas del palo?",
    options: ["4", "8", "9", "13"],
    answer: 2,
    explanation: "Hay 13 cartas de cada palo, ves 4, quedan 9.",
  },
  {
    id: "mat-outs-escalera",
    topic: "Matemáticas",
    question: "¿Cuántos outs tiene una escalera abierta por los dos lados?",
    options: ["4", "6", "8", "10"],
    answer: 2,
    explanation: "Dos rangos te sirven, 4 cartas de cada uno: 8 outs. Un gutshot solo tiene 4.",
  },
  {
    id: "mat-set",
    topic: "Matemáticas",
    question: "Con una pareja en mano, ¿cuántas veces ligas trío en el flop?",
    options: ["Una de cada 3", "Una de cada 8,5", "Una de cada 20", "La mitad"],
    answer: 1,
    explanation:
      "Aproximadamente el 12%, una de cada 8,5. Por eso las parejas bajas necesitan entrar baratas y stacks profundos.",
  },
  {
    id: "mat-ev",
    topic: "Matemáticas",
    question: "¿Qué mide el EV (valor esperado)?",
    options: [
      "Lo que ganas en esa mano concreta",
      "Lo que ganarías de media repitiendo esa decisión infinitas veces",
      "La probabilidad de ganar el bote",
      "El dinero que llevas en la mesa",
    ],
    answer: 1,
    explanation:
      "El EV es la media a largo plazo. Una decisión +EV puede perder hoy y seguir siendo la correcta.",
  },
  {
    id: "mat-farol",
    topic: "Matemáticas",
    question: "Apuestas el tamaño del bote como farol. ¿Cuántas veces tiene que colar?",
    options: ["25%", "33%", "50%", "66%"],
    answer: 2,
    explanation: "Arriesgas 100 para ganar 100: necesitas que funcione la mitad de las veces.",
  },
  {
    id: "mat-mdf",
    topic: "Matemáticas",
    question: "El rival apuesta medio bote. ¿Qué parte de tu rango deberías defender como mínimo?",
    options: ["Un 33%", "Un 50%", "Un 67%", "Todo"],
    answer: 2,
    explanation:
      "MDF = bote/(bote+apuesta) = 100/150 = 67%. Si defiendes menos, farolear con cualquier cosa le sale gratis.",
  },
  {
    id: "mat-rake",
    topic: "Matemáticas",
    question: "¿Qué es el rake?",
    options: [
      "La comisión que se lleva la sala de cada bote",
      "La apuesta obligatoria del botón",
      "El bote acumulado",
      "El descuento por jugar muchas manos",
    ],
    answer: 0,
    explanation:
      "Es el coste de jugar. En micro límites puede ser la diferencia entre ganar y perder: cuenta siempre con él.",
  },

  // -------------------------------------------------------------- Preflop
  {
    id: "pre-utg-rango",
    topic: "Preflop",
    question: "Desde UTG en una mesa de 9, ¿qué porcentaje de manos abres aproximadamente?",
    options: ["Un 5%", "Un 10%", "Un 25%", "Un 40%"],
    answer: 1,
    explanation:
      "Alrededor del 8-12%: parejas medias y altas, ases fuertes suited y poco más. Quedan ocho por detrás.",
  },
  {
    id: "pre-btn-rango",
    topic: "Preflop",
    question: "Desde el botón, ¿qué porcentaje de manos abres si te llega la mano sin subir?",
    options: ["Un 10%", "Un 20%", "Un 45%", "El 100%"],
    answer: 2,
    explanation:
      "Cerca del 45%. Solo quedan las dos ciegas y jugarás en posición el resto de la mano.",
  },
  {
    id: "pre-limp",
    topic: "Preflop",
    question: "¿Por qué es mala idea igualar la ciega (limpear) como primer jugador en el bote?",
    options: [
      "Está prohibido",
      "Renuncias a ganar el bote sin pelea y das precio a todos",
      "Pagas más rake",
      "No puedes ganar el bote",
    ],
    answer: 1,
    explanation:
      "Subiendo puedes llevarte las ciegas ya mismo y tomas la iniciativa. Limpeando invitas a todos a ver un flop barato.",
  },
  {
    id: "pre-3bet",
    topic: "Preflop",
    question: "¿Qué es un 3-bet?",
    options: [
      "La tercera apuesta del flop",
      "La resubida sobre la primera subida",
      "Apostar tres veces el bote",
      "Igualar tres veces",
    ],
    answer: 1,
    explanation:
      "Las ciegas son la apuesta 1, la subida es la 2 y la resubida es la 3: el 3-bet. La siguiente es el 4-bet.",
  },
  {
    id: "pre-tamano",
    topic: "Preflop",
    question: "¿Cuál es un tamaño de apertura razonable online?",
    options: ["1 ciega grande", "2-3 ciegas grandes", "6 ciegas grandes", "El stack entero"],
    answer: 1,
    explanation:
      "Entre 2 y 3bb, más si hay limpers (añade ~1bb por cada uno). Suficiente para cobrar valor sin arriesgar de más.",
  },
  {
    id: "pre-suited",
    topic: "Preflop",
    question: "¿Cuánta equity extra te da que tu mano sea del mismo palo?",
    options: [
      "Nada, es una leyenda",
      "Entre un 2% y un 4%, y sobre todo jugabilidad",
      "Un 15%",
      "El doble",
    ],
    answer: 1,
    explanation:
      "El color añade poco en bruto, pero cambia mucho cómo juegas el flop: proyectos, presión y botes grandes cuando ligas.",
  },
  {
    id: "pre-aa",
    topic: "Preflop",
    question: "¿Cada cuántas manos recibes AA?",
    options: ["Cada 55", "Cada 221", "Cada 1000", "Cada 20"],
    answer: 1,
    explanation:
      "6 combinaciones de 1326: una de cada 221 manos. Cualquier pareja concreta sale con la misma frecuencia.",
  },

  // ------------------------------------------------------------- Bankroll
  {
    id: "bank-cash",
    topic: "Bankroll",
    question: "¿Cuántos buy-ins conviene tener para jugar un nivel de cash con tranquilidad?",
    options: ["5", "10", "30-50", "200"],
    answer: 2,
    explanation:
      "30 es el mínimo asumiendo riesgo; 50 te deja jugar sin pensar en el dinero, que es justo el objetivo.",
  },
  {
    id: "bank-mtt",
    topic: "Bankroll",
    question: "¿Y para torneos multimesa?",
    options: ["20 buy-ins", "50 buy-ins", "100-200 buy-ins", "Los mismos que en cash"],
    answer: 2,
    explanation:
      "Los torneos concentran el premio en las primeras posiciones: puedes estar 200 torneos sin una mesa final jugando bien.",
  },
  {
    id: "bank-downswing",
    topic: "Bankroll",
    question: "Llevas 15 buy-ins de bajada jugando bien. ¿Qué significa?",
    options: [
      "Que juegas mal seguro",
      "Que es una racha normal dentro de la varianza",
      "Que la sala está amañada",
      "Que debes subir de nivel para recuperar",
    ],
    answer: 1,
    explanation:
      "Un downswing de 15-20 buy-ins le ocurre a jugadores ganadores. Revisa tus manos, pero no cambies de plan por una racha.",
  },
  {
    id: "bank-winrate",
    topic: "Bankroll",
    question: "¿Cuál es la métrica estándar de win-rate en cash?",
    options: ["Botes ganados", "bb/100 manos", "Euros por sesión", "Manos jugadas"],
    answer: 1,
    explanation:
      "Ciegas grandes ganadas cada 100 manos. Permite comparar niveles distintos y sesiones de distinta duración.",
  },
  {
    id: "bank-muestra",
    topic: "Bankroll",
    question: "¿Cuántas manos hacen falta para fiarte de tu win-rate en cash?",
    options: ["1.000", "10.000", "100.000 o más", "500"],
    answer: 2,
    explanation:
      "Por debajo de 100.000 manos el ruido domina. En 10.000 manos un perdedor puede ir ganando y al revés.",
  },
  {
    id: "bank-tilt",
    topic: "Bankroll",
    question: "¿Cuál es la mejor respuesta al tilt?",
    options: [
      "Subir de nivel para recuperar rápido",
      "Tener una regla de parada decidida antes de sentarte",
      "Jugar más mesas",
      "Cambiar de sala",
    ],
    answer: 1,
    explanation:
      "La decisión se toma en frío: 'me levanto si pierdo X buy-ins o si noto Y'. En caliente nadie decide bien.",
  },
];

export const QUESTION_IDS = QUESTIONS.map((q) => q.id);

export const questionsByTopic = (topic: Topic): Question[] =>
  QUESTIONS.filter((question) => question.topic === topic);
