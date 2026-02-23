// ======================================================
// utils/strategies.ts
// GENERADOR INTELIGENTE GLOBAL DE ITINERARIOS
// Limpio • tipado fuerte • sin errores TS
// ======================================================

/* ======================================================
   TYPES
====================================================== */

export type Step = {
  id: string;
  title: string;
  duration: number; // minutos
  completed: boolean;
};

export type StrategyResult = {
  steps: Step[];
  warning?: string;
};

/* ======================================================
   STRATEGIES DISPONIBLES POR CATEGORÍA
   (debe coincidir EXACTO con GoalCategory)
====================================================== */

export const STRATEGIES: Record<string, string[]> = {
  Fitness: ["Full Body", "Push Pull Legs", "Cardio + Fuerza"],

  Estudio: ["Pomodoro", "Deep Study", "Repaso Activo"],

  Carrera: ["Deep Work", "Oficina Ligera", "Sprint Creativo", "GTD Pro"],

  Salud: [
    "bienestar_diario",
    "energia_maxima",
    "descanso_profundo",
    "mente_tranquila",
    "reset_saludable",
  ],

  Finanzas: [
    "ahorro_basico",
    "control_gastos",
    "salir_deudas",
    "fondo_emergencia",
    "invertir_principiante",
    "ingresos_extra",
  ],

  Otro: ["Plan Básico"],
};

/* ======================================================
   HELPERS
====================================================== */

const id = () => Math.random().toString(36).slice(2);

const makeStep = (title: string, duration: number): Step => ({
  id: id(),
  title,
  duration: Math.max(1, Math.round(duration)),
  completed: false,
});

const splitTime = (total: number, parts: number): number[] => {
  const base = Math.floor(total / parts);
  const arr = Array(parts).fill(base);
  arr[0] += total - base * parts;
  return arr;
};

/* ======================================================
   GENERADOR PRINCIPAL (ROUTER)
====================================================== */

export function generateSteps(
  category: string,
  strategy: string,
  minutes: number,
): StrategyResult {
  switch (category) {
    case "Fitness":
      return fitnessGenerator(strategy, minutes);

    case "Estudio":
      return studyGenerator(strategy, minutes);

    case "Carrera":
      return careerGenerator(strategy, minutes);

    case "Finanzas":
      return financeGenerator(strategy, minutes);

    case "Salud":
      return healthGenerator(strategy, minutes);

    default:
      return basicGenerator(minutes);
  }
}

/* ======================================================
   BASIC (fallback seguro)
====================================================== */

function basicGenerator(minutes: number): StrategyResult {
  const parts = splitTime(minutes, 3);

  return {
    steps: [
      makeStep("Inicio", parts[0]),
      makeStep("Trabajo principal", parts[1]),
      makeStep("Cierre", parts[2]),
    ],
  };
}

/* ======================================================
   FITNESS PRO
====================================================== */

function fitnessGenerator(strategy: string, minutes: number): StrategyResult {
  const muscles = {
    push: ["Pecho", "Hombro", "Tríceps"],
    pull: ["Espalda", "Bíceps", "Antebrazo"],
    legs: ["Piernas", "Glúteos", "Core"],
  } as const;

  const exercises: Record<string, string[]> = {
    Pecho: ["Press banca", "Flexiones", "Aperturas"],
    Hombro: ["Press militar", "Elevaciones laterales", "Face pull"],
    Tríceps: ["Fondos", "Extensiones polea", "Patada tríceps"],
    Espalda: ["Dominadas", "Remo barra", "Jalón al pecho"],
    Bíceps: ["Curl barra", "Curl martillo", "Curl alterno"],
    Antebrazo: ["Farmer carry", "Curl muñeca"],
    Piernas: ["Sentadilla", "Prensa", "Zancadas"],
    Glúteos: ["Hip thrust", "Step ups"],
    Core: ["Plancha", "Crunch", "Mountain climbers"],
  };

  const plan =
    strategy === "Push Pull Legs"
      ? muscles.push
      : strategy === "Cardio + Fuerza"
        ? ["Piernas", "Core", "Pecho"]
        : ["Pecho", "Espalda", "Piernas"];

  const exercisesPerMuscle = 2;
  const total = plan.length * exercisesPerMuscle;

  if (minutes / total < 4) {
    return {
      steps: [],
      warning:
        "Muy poco tiempo para esta rutina. Aumenta minutos o crea manualmente.",
    };
  }

  const time = Math.floor(minutes / total);

  const steps: Step[] = [];

  plan.forEach((m) => {
    const list = exercises[m];

    for (let i = 0; i < exercisesPerMuscle; i++) {
      const ex = list[Math.floor(Math.random() * list.length)];
      steps.push(makeStep(`${m} • ${ex}`, time));
    }
  });

  return { steps };
}

/* ======================================================
   STUDY PRO
====================================================== */

function studyGenerator(strategy: string, minutes: number): StrategyResult {
  const steps: Step[] = [];

  if (strategy === "Pomodoro") {
    let used = 0;

    while (used + 25 <= minutes) {
      steps.push(makeStep("Estudio enfocado", 25));
      used += 25;

      if (used + 5 <= minutes) {
        steps.push(makeStep("Descanso", 5));
        used += 5;
      }
    }
  } else if (strategy === "Deep Study") {
    const [a, b, c] = splitTime(minutes, 3);
    steps.push(makeStep("Lectura profunda", a));
    steps.push(makeStep("Práctica", b));
    steps.push(makeStep("Resumen", c));
  } else {
    const [a, b, c] = splitTime(minutes, 3);
    steps.push(makeStep("Repaso activo", a));
    steps.push(makeStep("Flashcards", b));
    steps.push(makeStep("Autoevaluación", c));
  }

  return { steps };
}

/* ======================================================
   CARRERA PRO
====================================================== */

function careerGenerator(strategy: string, minutes: number): StrategyResult {
  const [a, b, c, d] = splitTime(minutes, 4);

  const map: Record<string, string[]> = {
    "Deep Work": ["Planificar", "Trabajo profundo", "Descanso", "Revisión"],
    "Oficina Ligera": ["Emails", "Reuniones", "Gestiones", "Organizar"],
    "Sprint Creativo": ["Inspiración", "Sprint 1", "Sprint 2", "Publicar"],
    "GTD Pro": ["Capturar", "Priorizar", "Ejecutar", "Revisar"],
  };

  const tasks = map[strategy] ?? map["GTD Pro"];

  return {
    steps: [
      makeStep(tasks[0], a),
      makeStep(tasks[1], b),
      makeStep(tasks[2], c),
      makeStep(tasks[3], d),
    ],
  };
}

/* ======================================================
   FINANZAS PRO (INTELIGENTE + VARIANTE DIARIA)
====================================================== */

function financeGenerator(strategy: string, minutes: number): StrategyResult {
  const tasks: Record<string, string[]> = {
    ahorro_basico: [
      "Registrar gastos del día",
      "Transferir ahorro automático",
      "Actualizar presupuesto",
    ],

    control_gastos: [
      "Categorizar compras",
      "Detectar excesos",
      "Optimizar gastos",
    ],

    salir_deudas: ["Revisar deudas", "Plan de pago", "Abonar extra"],

    fondo_emergencia: ["Calcular meta", "Separar dinero", "Revisar progreso"],

    invertir_principiante: [
      "Aprender conceptos",
      "Investigar ETF/acciones",
      "Simular inversión",
    ],

    ingresos_extra: [
      "Buscar oportunidades",
      "Contactar clientes",
      "Trabajar proyecto",
    ],
  };

  const selected = tasks[strategy] ?? tasks["ahorro_basico"];

  const times = splitTime(minutes, selected.length);

  return {
    steps: selected.map((t, i) => makeStep(t, times[i])),
  };
}
/* ======================================================
   SALUD PRO (HÁBITOS INTELIGENTES)
====================================================== */

function healthGenerator(strategy: string, minutes: number): StrategyResult {
  const tasks: Record<string, string[]> = {
    bienestar_diario: [
      "Hidratarse (agua + electrolitos)",
      "Movilidad / estiramientos",
      "Caminata ligera",
      "Comida saludable planificada",
    ],

    energia_maxima: [
      "Ejercicio ligero (cardio o HIIT)",
      "Ducha fría o contraste",
      "Respiración energizante",
      "Plan del día",
    ],

    descanso_profundo: [
      "Desconectar pantallas",
      "Estiramientos suaves",
      "Meditación o lectura",
      "Preparar horario de sueño",
    ],

    mente_tranquila: [
      "Respiración consciente",
      "Escribir pensamientos",
      "Meditación guiada",
      "Actividad relajante",
    ],

    reset_saludable: [
      "Ordenar espacio personal",
      "Comida limpia / casera",
      "Caminata al aire libre",
      "Reflexión + planificación semanal",
    ],
  };

  const selected = tasks[strategy] ?? tasks["bienestar_diario"];

  const times = splitTime(minutes, selected.length);

  return {
    steps: selected.map((t, i) => makeStep(t, times[i])),
  };
}
