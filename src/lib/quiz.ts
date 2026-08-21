/**
 * Banco de preguntas del quiz.
 *
 * Cubre lo que hay que saber de memoria: el ranking de manos y sus desempates
 * (tal cual los define la guía oficial), el orden de juego, la posición, la
 * matemática básica y las reglas de bankroll.
 */

export type Topic =
  | "Reglas"
  | "Ranking"
  | "Posición"
  | "Matemáticas"
  | "Preflop"
  | "Postflop"
  | "Bankroll";

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
  "Postflop",
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
  // -------------------------------------------------- Preflop (limpers, squeeze)
  {
    id: "pre-iso-tamano",
    topic: "Preflop",
    question: "Dos jugadores han limpeado y quieres subir desde el cutoff. ¿De cuánto es la subida?",
    options: ["2,5bb", "3bb", "5bb", "12bb"],
    answer: 2,
    explanation:
      "La regla es 4bb más 1bb por cada limper extra: con dos limpers, 5bb. Subir 2,5bb les da precio para pagar con cualquier cosa.",
  },
  {
    id: "pre-limp-propio",
    topic: "Preflop",
    question: "¿Cuándo es correcto limpear tú el primero?",
    options: [
      "Con parejas pequeñas desde posición temprana",
      "Nunca: si la mano vale para entrar, vale para subir",
      "Con suited conectores desde las ciegas",
      "Cuando llevas rato sin jugar una mano",
    ],
    answer: 1,
    explanation:
      "Limpear renuncia a ganar el bote sin pelea y entra sin definir tu rango. Sube o tírate; el overlimp detrás de otros es la única excepción.",
  },
  {
    id: "pre-squeeze-que-es",
    topic: "Preflop",
    question: "¿Qué es un squeeze?",
    options: [
      "Resubir sobre un open que ya tiene un caller",
      "Igualar una subida desde la ciega grande",
      "Subir all-in con stack corto",
      "Apostar el flop tras haber subido preflop",
    ],
    answer: 0,
    explanation:
      "Aprietas al que abrió porque todavía tiene un caller detrás, y ese caller tiene el rango capado: si tuviera una mano premium habría resubido él.",
  },
  {
    id: "pre-squeeze-tamano",
    topic: "Preflop",
    question: "Abren a 2,5bb, iguala el botón y quieres squeezear desde la ciega grande. ¿Cuánto?",
    options: ["6bb", "8bb", "12bb", "25bb"],
    answer: 2,
    explanation:
      "Squeeze desde las ciegas: unas 5 veces el open, más 1x por caller. Un squeeze pequeño le da al que abrió el precio perfecto para pagar en posición.",
  },
  {
    id: "pre-4bet-micro",
    topic: "Preflop",
    question: "En micro límites, ¿qué significa casi siempre un 4-bet de un desconocido?",
    options: [
      "Un farol con blockers",
      "A-A, K-K, Q-Q o A-K",
      "Cualquier pareja",
      "Un as suited cualquiera",
    ],
    answer: 1,
    explanation:
      "En límites bajos el 4-bet es valor puro. Tirar A-Q o J-J contra un desconocido que te resube no es cobardía: es la jugada que gana dinero.",
  },
  // ---------------------------------------------------------------- Postflop
  {
    id: "post-spr-que-es",
    topic: "Postflop",
    question: "¿Qué mide el SPR?",
    options: [
      "El stack efectivo dividido por el bote al empezar el flop",
      "Las apuestas que quedan hasta el river",
      "El porcentaje de manos que abres",
      "La equity de tu mano contra un rango",
    ],
    answer: 0,
    explanation:
      "SPR = stack efectivo ÷ bote. Con SPR bajo (0-3) top pair vale un stack entero; con SPR alto (14+) hace falta trío o mejor.",
  },
  {
    id: "post-spr-compromiso",
    topic: "Postflop",
    question: "Bote de 20bb en el flop y 60bb detrás. ¿Qué SPR hay y qué implica?",
    options: [
      "SPR 3: con overpair o top pair fuerte se juega el stack",
      "SPR 3: hace falta trío como mínimo",
      "SPR 12: se juega por el bote, no por la pila",
      "No se puede calcular sin saber las cartas",
    ],
    answer: 0,
    explanation:
      "60 ÷ 20 = 3. Con SPR de 0 a 3 estás comprometido: una pareja alta con buen kicker ya vale el stack entero.",
  },
  {
    id: "post-set-mining",
    topic: "Postflop",
    question: "¿Cuánto stack efectivo necesitas para pagar una subida buscando trío con una pareja pequeña?",
    options: ["5 veces lo que pagas", "10 veces", "15 veces o más", "Da igual el stack"],
    answer: 2,
    explanation:
      "Ligas trío el 12% de las veces, así que necesitas cobrar mucho cuando aciertas: al menos 15 veces lo que pagas en stack efectivo.",
  },
  {
    id: "post-multiway-cbet",
    topic: "Postflop",
    question: "¿Cómo cambia tu c-bet en un bote con tres rivales?",
    options: [
      "Igual que en heads-up",
      "Apuestas más a menudo para que se retiren",
      "Apuestas mucho menos: solo valor claro y proyectos fuertes",
      "Apuestas siempre pequeño con todo tu rango",
    ],
    answer: 2,
    explanation:
      "Contra tres rangos a la vez el farol casi no funciona: todos tienen que tirarse. Se apuesta con manos que quieren acción y con proyectos fuertes.",
  },
  {
    id: "post-multiway-manos",
    topic: "Postflop",
    question: "¿Qué manos ganan valor cuando la mesa juega muchos botes multiway?",
    options: [
      "Ases con kicker flojo y broadways offsuit",
      "Parejas, suited conectores y suited aces",
      "Cualquier carta alta",
      "Las mismas que en heads-up",
    ],
    answer: 1,
    explanation:
      "Multiway gana el que liga mano hecha, no el que liga pareja. Las manos que buscan trío, color o escalera suben de valor; K-J o A-8o bajan.",
  },
  {
    id: "post-multiway-lectura",
    topic: "Postflop",
    question: "Dos jugadores pasan y el tercero apuesta en un bote multiway. ¿Qué significa?",
    options: [
      "Suele ser un farol: hay demasiada gente",
      "Es un rango fuerte y real: nadie roba contra tres",
      "Siempre es un proyecto",
      "No aporta ninguna información",
    ],
    answer: 1,
    explanation:
      "Apostar con tres jugadores en el bote exige una mano de verdad. Esa apuesta se respeta mucho más que la misma apuesta en heads-up.",
  },

  // --------------------------------------- cash en vivo: rastrillo y árbol preflop
  {
    id: "pre-rastrillo-rangos",
    topic: "Preflop",
    question: "¿Por qué en cash se abre un rango más cerrado que en torneo con los mismos 100bb?",
    options: [
      "Porque en cash los rivales juegan mejor",
      "Porque en torneo hay ante y no sale rastrillo: el bote es mayor y se pelea más",
      "Porque en cash los stacks son más profundos",
      "No hay diferencia: el rango correcto es el mismo",
    ],
    answer: 1,
    explanation:
      "El rango correcto depende de cuánto vale el bote. En torneo hay ante en cada mano y el bote llega entero al ganador; en cash es menor y encima el casino se lleva su parte.",
  },
  {
    id: "pre-k8-suited",
    topic: "Preflop",
    question: "K-8 del mismo palo se abre desde UTG y K-8 de distinto palo no se abre ni desde el botón. ¿Por qué?",
    options: [
      "Porque suited gana un 4% más de veces en el showdown",
      "Porque el color añade proyecto: una calle más de farol creíble y la posibilidad de ligar la mano máxima",
      "Porque las tablas de suited están mal calculadas",
      "Porque offsuit solo se juega con stacks profundos",
    ],
    answer: 1,
    explanation:
      "El 4% de equity no justifica la diferencia. Lo que cambia es cuántas formas tienes de ganar el bote: con proyecto de color puedes apostar tres calles; con rey alto no puedes apostar ninguna.",
  },
  {
    id: "pre-dominacion",
    topic: "Preflop",
    question: "Abres, te resuben desde posición temprana. ¿Qué mano aguanta mejor, A-10s o 9-8s?",
    options: [
      "A-10s: tiene un as y liga escalera",
      "9-8s: A-10s va dominada por A-K y A-Q",
      "Las dos igual: tienen equity parecida",
      "Ninguna: las dos se tiran siempre",
    ],
    answer: 1,
    explanation:
      "Con A-10s, cuando el flop trae un as ligas la misma pareja que él con peor acompañante: ganas botes pequeños y pagas los grandes. 9-8s no está dominada por nada de su rango.",
  },
  {
    id: "pre-4bet-jj",
    topic: "Preflop",
    question: "Abres desde UTG, te resuben desde UTG+1 y llevas J-J. ¿Qué haces?",
    options: [
      "4-bet: es una pareja grande",
      "Igualar y ver el flop",
      "All-in directamente",
      "Tirar sin pensarlo",
    ],
    answer: 1,
    explanation:
      "Su rango para resubir ahí es A-A, K-K, Q-Q y A-K. Contra las parejas vas con un 20% y contra A-K es moneda al aire: no hay ninguna mano contra la que seas favorito. Se iguala y se decide en el flop.",
  },
  {
    id: "pre-blocker-combos",
    topic: "Matemáticas",
    question: "Llevas un as en la mano. ¿Cuántas combinaciones de A-A le quedan al rival?",
    options: ["6", "4", "3", "1"],
    answer: 2,
    explanation:
      "Hay 6 combinaciones de A-A. Tener un as elimina la mitad: le quedan 3. Con A-K pasa parecido, de 16 combinaciones le quedan 12. Por eso los faroles con as bloquean tan bien.",
  },
  {
    id: "pre-open-grande",
    topic: "Preflop",
    question: "En tu mesa hay uno que abre a 5bb en vez de a 3bb. ¿Cómo le defiendes?",
    options: [
      "Más ancho: está regalando dinero al bote",
      "Igual que a los demás: el rango no depende del tamaño",
      "Mucho más cerrado: arriesga mucho para ganar poco y su rango tiene que ser fuerte",
      "Solo con parejas, siempre",
    ],
    answer: 2,
    explanation:
      "Es la misma cuenta de las pot odds aplicada antes del flop: te está pidiendo casi el doble para optar a lo mismo. Contra opens de 5bb ni siquiera J-J es un 3-bet automático.",
  },
  {
    id: "pos-sb-tamano",
    topic: "Posición",
    question: "Todos se retiran y abres desde la ciega pequeña. ¿Por qué se sube a 4bb en vez de a 3bb?",
    options: [
      "Para que el rival pague más cuando ligues",
      "Porque no te importa que se retire y el bote grande hace que el rastrillo tope antes del flop",
      "Porque desde las ciegas siempre se sube el doble",
      "Para disimular el rango",
    ],
    answer: 1,
    explanation:
      "Ganar el bote ahí mismo es un resultado excelente cuando vas a jugar fuera de posición. Y si el rastrillo ya ha topado preflop, el resto de la mano se juega prácticamente sin comisión.",
  },
  {
    id: "pos-stacks-mesa",
    topic: "Posición",
    question: "¿Cómo quieres que estén repartidos los stacks respecto al tuyo?",
    options: [
      "Cubrir a los de tu izquierda y que te cubran los de tu derecha",
      "Cubrir a los de tu derecha y que no te cubran los de tu izquierda",
      "Ser siempre el stack más corto de la mesa",
      "Da igual: el stack no depende del asiento",
    ],
    answer: 1,
    explanation:
      "En no-limit las fichas fluyen hacia la izquierda: ganas dinero de la gente sobre la que tienes posición. Quieres poder cobrarles el bote entero, y no jugar botes profundos contra quien te tiene a ti en desventaja.",
  },
  {
    id: "pre-vs-cerrado",
    topic: "Preflop",
    question: "Tu mesa es dura: todos juegan cerrado y bien. ¿Cómo ajustas tu rango de apertura?",
    options: [
      "Más ancho: se retiran mucho y puedes robar",
      "Más cerrado: si nadie paga con manos peores, el final de tu rango deja de ganar dinero",
      "Igual: los rangos no se ajustan por rival",
      "Solo abres desde el botón",
    ],
    answer: 1,
    explanation:
      "Contra rivales cerrados se juega más cerrado, no más ancho. Ampliar contra buenos jugadores es regalarles el terreno donde son mejores que tú: los botes postflop con manos flojas.",
  },
  {
    id: "pre-aislar",
    topic: "Preflop",
    question: "Abre un jugador malo desde el botón y en la ciega grande hay un jugador bueno. Estás en la ciega pequeña. ¿Qué buscas?",
    options: [
      "Igualar para jugar multiway",
      "Resubir ancho para que el bueno se retire y quedarte a solas con el malo",
      "Tirar salvo con las premium",
      "Resubir solo con A-A y K-K",
    ],
    answer: 1,
    explanation:
      "El objetivo no es la mano: es con quién te quedas en el bote. Si los dos rivales fueran malos, la respuesta sería la contraria: igualar y jugar el bote multiway contra los dos.",
  },
  {
    id: "reglas-repartir-ciega",
    topic: "Reglas",
    question: "La mano queda entre las dos ciegas y la sala permite repartir. ¿Qué suele convenir?",
    options: [
      "Jugar siempre: eres mejor jugador",
      "Repartir salvo que el rival sea claramente peor que tú",
      "Repartir siempre, sin excepción",
      "Depende del color de tus cartas",
    ],
    answer: 1,
    explanation:
      "Si jugáis y llega el flop, el casino se lleva su parte de un bote pequeño. Hace falta bastante ventaja sobre el rival para superar ese peaje, así que por defecto se reparte.",
  },
  {
    id: "pre-4bet-aa-posicion",
    topic: "Preflop",
    question: "Resubiste desde el botón y te 4-betean. ¿Por qué se iguala a veces con A-A en vez de meter el stack?",
    options: [
      "Para ver si liga color",
      "Para proteger el rango de igualar: si A-A puede estar dentro, su apuesta del flop nunca es gratis",
      "Porque A-A juega mal en botes grandes",
      "Para reducir la varianza de la sesión",
    ],
    answer: 1,
    explanation:
      "Si siempre metes el stack con A-A y A-K, tu rango de call se queda flojo y te apuesta el flop entero sin miedo. Solo funciona en posición: fuera de posición no hay nada que proteger.",
  },
  {
    id: "post-donk-profundo",
    topic: "Postflop",
    question: "Con 100bb, fuera de posición y contra el que subió preflop, ¿conviene apostar tú primero en el flop?",
    options: [
      "Sí, para no dar cartas gratis",
      "Casi nunca: fuera de posición realizas peor tu equity y le das la información gratis",
      "Sí, siempre que tengas top pair",
      "Solo con proyecto de color",
    ],
    answer: 1,
    explanation:
      "Apostar primero (donk bet) es cosa de stacks cortos. Con dinero detrás conviene pasar: así todas tus manos fuertes siguen dentro del rango y cada apuesta suya está en peligro.",
  },
];

export const QUESTION_IDS = QUESTIONS.map((q) => q.id);

export const questionsByTopic = (topic: Topic): Question[] =>
  QUESTIONS.filter((question) => question.topic === topic);
