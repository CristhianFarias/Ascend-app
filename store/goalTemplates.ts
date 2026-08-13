import type { GoalTemplate } from "./goalTypes";

/**
 * Plantillas base para crear metas rápidamente.
 * Mantenerlas fuera del store facilita editar contenido sin tocar acciones.
 */
export const DEFAULT_TEMPLATES: GoalTemplate[] = [
  /* =========================
     FITNESS
     ========================= */
/* =========================
   FITNESS
   ========================= */
{
  id: "fit-arnold-split",
  name: "Arnold Split",
  category: "Fitness",
  subCategory: "Fuerza",
  description: "Rutina clásica de Arnold adaptada según el entorno de entrenamiento.",
  color: "#ef4444",
  icon: "activity",
  frequencyPerWeek: 6,
  estimatedMinutes: 75,
  defaultPriority: "1",
  defaultType: "Proyecto",
  defaultScheduleMode: "weeklyPlan",
  workoutStyle: "Arnold Split",
  workoutEnvironment: "Mixto",
  primaryObjectives: ["hypertrophy"],
  secondaryObjectives: ["strength"],
  flexibilityTags: ["volumen", "masa muscular", "fuerza"],
  environmentPlans: {
    Casa: [
      {
        name: "Pecho y espalda en casa",
        exercises: [
          { name: "Flexiones", sets: 4, reps: 12, rest: 60, duration: 12 },
          { name: "Remo con banda o mochila", sets: 4, reps: 12, rest: 60, duration: 12 },
          { name: "Aperturas en el suelo", sets: 3, reps: 15, rest: 45, duration: 10 },
        ],
      },
      {
        name: "Hombros y brazos en casa",
        exercises: [
          { name: "Pike push-ups", sets: 4, reps: 10, rest: 60, duration: 10 },
          { name: "Curl con mochila/banda", sets: 3, reps: 12, rest: 45, duration: 8 },
          { name: "Fondos entre sillas", sets: 3, reps: 10, rest: 60, duration: 8 },
        ],
      },
      {
        name: "Piernas en casa",
        exercises: [
          { name: "Sentadillas", sets: 4, reps: 20, rest: 60, duration: 10 },
          { name: "Zancadas", sets: 3, reps: 12, rest: 60, duration: 8 },
          { name: "Puente de glúteo", sets: 4, reps: 15, rest: 45, duration: 8 },
        ],
      },
    ],
    Gimnasio: [
      {
        name: "Pecho y espalda",
        exercises: [
          { name: "Press banca", sets: 4, reps: 8, rest: 120, duration: 15 },
          { name: "Remo con barra", sets: 4, reps: 8, rest: 120, duration: 15 },
          { name: "Aperturas en máquina", sets: 3, reps: 12, rest: 75, duration: 10 },
        ],
      },
      {
        name: "Hombros y brazos",
        exercises: [
          { name: "Press militar", sets: 4, reps: 8, rest: 120, duration: 12 },
          { name: "Curl bíceps", sets: 3, reps: 10, rest: 75, duration: 8 },
          { name: "Extensión tríceps", sets: 3, reps: 10, rest: 75, duration: 8 },
        ],
      },
      {
        name: "Piernas",
        exercises: [
          { name: "Sentadilla", sets: 4, reps: 8, rest: 120, duration: 15 },
          { name: "Prensa", sets: 4, reps: 10, rest: 90, duration: 12 },
          { name: "Peso muerto rumano", sets: 4, reps: 10, rest: 90, duration: 12 },
        ],
      },
    ],
    Mixto: [
      {
        name: "Empuje y tirón",
        exercises: [
          { name: "Flexiones o press", sets: 4, reps: 10, rest: 90, duration: 12 },
          { name: "Remo o jalón", sets: 4, reps: 10, rest: 90, duration: 12 },
          { name: "Press hombro", sets: 3, reps: 10, rest: 75, duration: 8 },
        ],
      },
      {
        name: "Brazos y core",
        exercises: [
          { name: "Curl bíceps", sets: 3, reps: 12, rest: 60, duration: 8 },
          { name: "Fondos o tríceps", sets: 3, reps: 12, rest: 60, duration: 8 },
          { name: "Plancha", sets: 3, reps: 1, rest: 45, duration: 5 },
        ],
      },
    ],
  },
  defaultPlan: [
    {
      name: "Pecho y espalda",
      exercises: [
        { name: "Flexiones o press", sets: 4, reps: 10, rest: 90, duration: 12 },
        { name: "Remo o jalón", sets: 4, reps: 10, rest: 90, duration: 12 },
        { name: "Aperturas", sets: 3, reps: 12, rest: 60, duration: 8 },
      ],
    },
    {
      name: "Hombros y brazos",
      exercises: [
        { name: "Press militar o pike push-ups", sets: 4, reps: 10, rest: 75, duration: 10 },
        { name: "Curl bíceps", sets: 3, reps: 12, rest: 60, duration: 8 },
        { name: "Tríceps", sets: 3, reps: 12, rest: 60, duration: 8 },
      ],
    },
    {
      name: "Piernas",
      exercises: [
        { name: "Sentadillas", sets: 4, reps: 15, rest: 75, duration: 10 },
        { name: "Zancadas", sets: 3, reps: 12, rest: 60, duration: 8 },
        { name: "Glúteo", sets: 3, reps: 15, rest: 45, duration: 8 },
      ],
    },
  ],
},
{
  id: "fit-heavy-duty",
  name: "Heavy Duty",
  category: "Fitness",
  subCategory: "Fuerza",
  description: "Rutina de alta intensidad con poco volumen y mucha exigencia.",
  color: "#ef4444",
  icon: "activity",
  frequencyPerWeek: 3,
  estimatedMinutes: 60,
  defaultPriority: "1",
  defaultType: "Proyecto",
  defaultScheduleMode: "weeklyPlan",
  workoutStyle: "Heavy Duty",
  workoutEnvironment: "Mixto",
  primaryObjectives: ["strength"],
  secondaryObjectives: ["hypertrophy"],
  flexibilityTags: ["intensidad", "fuerza", "bajo volumen"],
  environmentPlans: {
    Casa: [
      {
        name: "Empuje intenso",
        exercises: [
          { name: "Flexiones al fallo", sets: 3, reps: 1, rest: 90, duration: 10 },
          { name: "Flexiones diamante", sets: 3, reps: 1, rest: 90, duration: 8 },
        ],
      },
      {
        name: "Tirón intenso",
        exercises: [
          { name: "Remo con mochila", sets: 3, reps: 1, rest: 90, duration: 10 },
          { name: "Isométricos de espalda", sets: 3, reps: 30, rest: 60, duration: 8 },
        ],
      },
      {
        name: "Pierna intensa",
        exercises: [
          { name: "Sentadilla lenta", sets: 3, reps: 20, rest: 90, duration: 10 },
          { name: "Zancadas", sets: 3, reps: 12, rest: 90, duration: 8 },
        ],
      },
    ],
    Gimnasio: [
      {
        name: "Pecho pesado",
        exercises: [
          { name: "Press banca", sets: 3, reps: 6, rest: 180, duration: 15 },
          { name: "Press inclinado", sets: 2, reps: 8, rest: 150, duration: 10 },
        ],
      },
      {
        name: "Espalda pesada",
        exercises: [
          { name: "Remo con barra", sets: 3, reps: 6, rest: 180, duration: 15 },
          { name: "Jalón al pecho", sets: 2, reps: 8, rest: 150, duration: 10 },
        ],
      },
      {
        name: "Pierna pesada",
        exercises: [
          { name: "Sentadilla", sets: 3, reps: 6, rest: 180, duration: 15 },
          { name: "Peso muerto rumano", sets: 2, reps: 8, rest: 150, duration: 10 },
        ],
      },
    ],
    Mixto: [
      {
        name: "Empuje",
        exercises: [
          { name: "Flexiones o press", sets: 3, reps: 8, rest: 120, duration: 12 },
          { name: "Fondos o tríceps", sets: 2, reps: 10, rest: 90, duration: 8 },
        ],
      },
      {
        name: "Tirón",
        exercises: [
          { name: "Remo", sets: 3, reps: 8, rest: 120, duration: 12 },
          { name: "Jalón o banda", sets: 2, reps: 10, rest: 90, duration: 8 },
        ],
      },
    ],
  },
  defaultPlan: [
    {
      name: "Sesión intensa",
      exercises: [
        { name: "Press o flexiones", sets: 3, reps: 8, rest: 120, duration: 12 },
        { name: "Remo o jalón", sets: 3, reps: 8, rest: 120, duration: 12 },
        { name: "Pierna", sets: 3, reps: 10, rest: 120, duration: 12 },
      ],
    },
  ],
},
{
  id: "fit-calistenia",
  name: "Calistenia progresiva",
  category: "Fitness",
  subCategory: "Calistenia",
  description: "Progresión de peso corporal adaptable a casa o parque.",
  color: "#ef4444",
  icon: "activity",
  frequencyPerWeek: 4,
  estimatedMinutes: 50,
  defaultPriority: "2",
  defaultType: "Hábito",
  defaultScheduleMode: "weeklyPlan",
  workoutStyle: "Calistenia",
  workoutEnvironment: "Mixto",
  primaryObjectives: ["strength"],
  secondaryObjectives: ["mobility", "hypertrophy"],
  flexibilityTags: ["peso corporal", "control", "movilidad"],
  environmentPlans: {
    Casa: [
      {
        name: "Empuje",
        exercises: [
          { name: "Flexiones", sets: 4, reps: 12, rest: 60, duration: 10 },
          { name: "Pike push-ups", sets: 3, reps: 10, rest: 60, duration: 8 },
        ],
      },
      {
        name: "Core",
        exercises: [
          { name: "Plancha", sets: 3, reps: 1, rest: 45, duration: 5 },
          { name: "Hollow hold", sets: 3, reps: 1, rest: 45, duration: 5 },
        ],
      },
      {
        name: "Pierna",
        exercises: [
          { name: "Sentadilla a una pierna asistida", sets: 3, reps: 8, rest: 60, duration: 8 },
          { name: "Zancadas", sets: 3, reps: 12, rest: 60, duration: 8 },
        ],
      },
    ],
    Gimnasio: [
      {
        name: "Empuje asistido",
        exercises: [
          { name: "Fondos asistidos", sets: 4, reps: 8, rest: 75, duration: 10 },
          { name: "Dominadas asistidas", sets: 4, reps: 6, rest: 90, duration: 10 },
        ],
      },
      {
        name: "Core y control",
        exercises: [
          { name: "Elevación de piernas", sets: 3, reps: 12, rest: 45, duration: 6 },
          { name: "Plancha", sets: 3, reps: 1, rest: 45, duration: 5 },
        ],
      },
      {
        name: "Pierna",
        exercises: [
          { name: "Sentadilla búlgara", sets: 3, reps: 10, rest: 75, duration: 8 },
          { name: "Hip thrust", sets: 3, reps: 12, rest: 75, duration: 8 },
        ],
      },
    ],
    Mixto: [
      {
        name: "Base",
        exercises: [
          { name: "Flexiones", sets: 4, reps: 10, rest: 60, duration: 10 },
          { name: "Remo invertido o banda", sets: 4, reps: 10, rest: 60, duration: 10 },
          { name: "Plancha", sets: 3, reps: 1, rest: 45, duration: 5 },
        ],
      },
    ],
  },
  defaultPlan: [
    {
      name: "Progresión base",
      exercises: [
        { name: "Flexiones", sets: 4, reps: 10, rest: 60, duration: 10 },
        { name: "Dominadas o remo", sets: 4, reps: 8, rest: 60, duration: 10 },
        { name: "Core", sets: 3, reps: 1, rest: 45, duration: 5 },
      ],
    },
  ],
},
{
  id: "fit-full-body",
  name: "Full Body",
  category: "Fitness",
  subCategory: "General",
  description: "Rutina completa para entrenar todo el cuerpo en pocas sesiones.",
  color: "#ef4444",
  icon: "activity",
  frequencyPerWeek: 3,
  estimatedMinutes: 55,
  defaultPriority: "2",
  defaultType: "Hábito",
  defaultScheduleMode: "weeklyPlan",
  workoutStyle: "Full Body",
  workoutEnvironment: "Mixto",
  primaryObjectives: ["habit"],
  secondaryObjectives: ["strength", "hypertrophy"],
  flexibilityTags: ["base", "principiante", "fuerza general"],
  environmentPlans: {
    Casa: [
      {
        name: "Cuerpo completo en casa",
        exercises: [
          { name: "Sentadillas", sets: 4, reps: 15, rest: 60, duration: 10 },
          { name: "Flexiones", sets: 4, reps: 10, rest: 60, duration: 10 },
          { name: "Puente de glúteo", sets: 3, reps: 15, rest: 45, duration: 8 },
        ],
      },
    ],
    Gimnasio: [
      {
        name: "Cuerpo completo en gimnasio",
        exercises: [
          { name: "Sentadilla", sets: 4, reps: 8, rest: 120, duration: 12 },
          { name: "Press banca", sets: 4, reps: 8, rest: 120, duration: 12 },
          { name: "Remo", sets: 4, reps: 8, rest: 120, duration: 12 },
        ],
      },
    ],
    Mixto: [
      {
        name: "Full body mixto",
        exercises: [
          { name: "Sentadillas", sets: 4, reps: 12, rest: 75, duration: 10 },
          { name: "Flexiones o press", sets: 4, reps: 10, rest: 75, duration: 10 },
          { name: "Remo o jalón", sets: 4, reps: 10, rest: 75, duration: 10 },
        ],
      },
    ],
  },
  defaultPlan: [
    {
      name: "Full body base",
      exercises: [
        { name: "Sentadillas", sets: 4, reps: 12, rest: 75, duration: 10 },
        { name: "Flexiones", sets: 4, reps: 10, rest: 75, duration: 10 },
        { name: "Remo", sets: 4, reps: 10, rest: 75, duration: 10 },
      ],
    },
  ],
},
{
  id: "fit-push-pull-legs-flex",
  name: "Push Pull Legs flexible",
  category: "Fitness",
  subCategory: "Hipertrofia",
  description: "Estructura rotativa para empuje, tirón y pierna, adaptable a fuerza, volumen o recomposición.",
  color: "#ef4444",
  icon: "activity",
  frequencyPerWeek: 5,
  estimatedMinutes: 65,
  defaultPriority: "1",
  defaultType: "Proyecto",
  defaultScheduleMode: "rotating",
  workoutStyle: "Push Pull Legs",
  workoutEnvironment: "Mixto",
  primaryObjectives: ["hypertrophy"],
  secondaryObjectives: ["strength", "fatLoss"],
  flexibilityTags: ["push pull legs", "hipertrofia", "fuerza", "recomposición"],
  environmentPlans: {
    Casa: [
      {
        name: "Empuje",
        exercises: [
          { name: "Flexiones con tempo", sets: 4, reps: 12, rest: 75, duration: 12 },
          { name: "Pike push-ups", sets: 3, reps: 10, rest: 75, duration: 10 },
          { name: "Fondos entre sillas", sets: 3, reps: 10, rest: 75, duration: 8 },
        ],
      },
      {
        name: "Tirón",
        exercises: [
          { name: "Remo con mochila", sets: 4, reps: 12, rest: 75, duration: 12 },
          { name: "Face pull con banda", sets: 3, reps: 15, rest: 60, duration: 8 },
          { name: "Curl con banda o mochila", sets: 3, reps: 12, rest: 60, duration: 8 },
        ],
      },
      {
        name: "Pierna",
        exercises: [
          { name: "Sentadilla búlgara", sets: 4, reps: 10, rest: 90, duration: 12 },
          { name: "Peso muerto con mochila", sets: 4, reps: 12, rest: 75, duration: 10 },
          { name: "Elevación de gemelos", sets: 4, reps: 15, rest: 45, duration: 6 },
        ],
      },
    ],
    Gimnasio: [
      {
        name: "Empuje",
        exercises: [
          { name: "Press banca", sets: 4, reps: 6, rest: 150, duration: 15 },
          { name: "Press inclinado", sets: 3, reps: 10, rest: 90, duration: 10 },
          { name: "Elevaciones laterales", sets: 3, reps: 15, rest: 60, duration: 8 },
        ],
      },
      {
        name: "Tirón",
        exercises: [
          { name: "Peso muerto o remo pesado", sets: 3, reps: 5, rest: 180, duration: 15 },
          { name: "Jalón al pecho", sets: 4, reps: 10, rest: 90, duration: 10 },
          { name: "Curl bíceps", sets: 3, reps: 12, rest: 60, duration: 8 },
        ],
      },
      {
        name: "Pierna",
        exercises: [
          { name: "Sentadilla", sets: 4, reps: 6, rest: 150, duration: 15 },
          { name: "Prensa", sets: 3, reps: 12, rest: 90, duration: 10 },
          { name: "Curl femoral", sets: 3, reps: 12, rest: 75, duration: 8 },
        ],
      },
    ],
    Mixto: [
      {
        name: "Empuje",
        exercises: [
          { name: "Press o flexiones", sets: 4, reps: 8, rest: 90, duration: 12 },
          { name: "Press hombro", sets: 3, reps: 10, rest: 75, duration: 10 },
          { name: "Tríceps", sets: 3, reps: 12, rest: 60, duration: 8 },
        ],
      },
      {
        name: "Tirón",
        exercises: [
          { name: "Remo o jalón", sets: 4, reps: 8, rest: 90, duration: 12 },
          { name: "Posterior de hombro", sets: 3, reps: 15, rest: 60, duration: 8 },
          { name: "Bíceps", sets: 3, reps: 12, rest: 60, duration: 8 },
        ],
      },
      {
        name: "Pierna",
        exercises: [
          { name: "Sentadilla o prensa", sets: 4, reps: 8, rest: 120, duration: 12 },
          { name: "Bisagra de cadera", sets: 3, reps: 10, rest: 90, duration: 10 },
          { name: "Core", sets: 3, reps: 1, rest: 45, duration: 6 },
        ],
      },
    ],
  },
  defaultPlan: [
    {
      name: "Empuje",
      exercises: [
        { name: "Press o flexiones", sets: 4, reps: 8, rest: 90, duration: 12 },
        { name: "Press hombro", sets: 3, reps: 10, rest: 75, duration: 10 },
      ],
    },
    {
      name: "Tirón",
      exercises: [
        { name: "Remo o jalón", sets: 4, reps: 8, rest: 90, duration: 12 },
        { name: "Bíceps", sets: 3, reps: 12, rest: 60, duration: 8 },
      ],
    },
    {
      name: "Pierna",
      exercises: [
        { name: "Sentadilla o prensa", sets: 4, reps: 8, rest: 120, duration: 12 },
        { name: "Core", sets: 3, reps: 1, rest: 45, duration: 6 },
      ],
    },
  ],
},
{
  id: "fit-movilidad-core",
  name: "Movilidad y Core",
  category: "Fitness",
  subCategory: "Movilidad",
  description: "Rutina para postura, control corporal y estabilidad.",
  color: "#ef4444",
  icon: "activity",
  frequencyPerWeek: 5,
  estimatedMinutes: 35,
  defaultPriority: "2",
  defaultType: "Hábito",
  defaultScheduleMode: "dailySame",
  workoutStyle: "Movilidad",
  workoutEnvironment: "Mixto",
  primaryObjectives: ["mobility"],
  secondaryObjectives: ["wellness", "habit"],
  flexibilityTags: ["recuperación", "postura", "core"],
  defaultPlan: [
    {
      name: "Movilidad",
      exercises: [
        { name: "Cuello y hombros", duration: 5 },
        { name: "Cadera y tobillos", duration: 5 },
      ],
    },
    {
      name: "Core",
      exercises: [
        { name: "Plancha frontal", sets: 3, reps: 1, rest: 45, duration: 4 },
        { name: "Plancha lateral", sets: 3, reps: 1, rest: 45, duration: 4 },
        { name: "Dead bug", sets: 3, reps: 12, rest: 45, duration: 8 },
      ],
    },
    {
      name: "Estiramiento",
      exercises: [
        { name: "Espalda baja", duration: 4 },
        { name: "Piernas", duration: 4 },
      ],
    },
  ],
},
{
  id: "fit-cardio-intervalos",
  name: "Cardio por intervalos",
  category: "Fitness",
  subCategory: "Resistencia",
  description: "Sesión para resistencia y quema calórica.",
  color: "#ef4444",
  icon: "activity",
  frequencyPerWeek: 4,
  estimatedMinutes: 45,
  defaultPriority: "2",
  defaultType: "Hábito",
  defaultScheduleMode: "weeklyPlan",
  workoutStyle: "Cardio",
  workoutEnvironment: "Mixto",
  primaryObjectives: ["endurance"],
  secondaryObjectives: ["fatLoss", "habit"],
  flexibilityTags: ["cardio", "intervalos", "quema calórica"],
  defaultPlan: [
    {
      name: "Preparación",
      exercises: [
        { name: "Caminata rápida", duration: 5 },
        { name: "Trote suave", duration: 5 },
      ],
    },
    {
      name: "Intervalos",
      exercises: [
        { name: "Sprint", duration: 1, sets: 8, rest: 60 },
        { name: "Recuperación activa", duration: 2, sets: 8, rest: 30 },
      ],
    },
    {
      name: "Enfriamiento",
      exercises: [
        { name: "Caminar", duration: 5 },
        { name: "Respiración y estiramiento", duration: 8 },
      ],
    },
  ],
},

  /* =========================
     ESTUDIO
     ========================= */
  {
    id: "est-pomodoro-intenso",
    name: "Pomodoro intensivo",
    category: "Estudio",
    description: "Sesión de enfoque para estudiar con bloques cortos.",
    color: "#06b6d4",
    icon: "book-open",
    frequencyPerWeek: 5,
    estimatedMinutes: 60,
    defaultPriority: "1",
    defaultType: "Meta",
    defaultScheduleMode: "dailySame",
    primaryObjectives: ["habit"],
    secondaryObjectives: ["exam"],
    flexibilityTags: ["enfoque", "pomodoro", "estudio diario"],
    defaultPlan: [
      {
        name: "Bloque 1",
        exercises: [
          { name: "Estudio enfocado", duration: 25 },
          { name: "Descanso", duration: 5 },
          { name: "Estudio enfocado", duration: 25 },
          { name: "Descanso final", duration: 5 },
        ],
      },
    ],
  },
  {
    id: "est-repaso-ejercicios",
    name: "Repaso y ejercicios",
    category: "Estudio",
    description: "Ideal para fortalecer temas y practicar.",
    color: "#06b6d4",
    icon: "book-open",
    frequencyPerWeek: 4,
    estimatedMinutes: 75,
    defaultPriority: "2",
    defaultType: "Proyecto",
    defaultScheduleMode: "weeklyPlan",
    primaryObjectives: ["exam"],
    secondaryObjectives: ["habit"],
    flexibilityTags: ["repaso", "práctica", "ejercicios"],
    defaultPlan: [
      {
        name: "Repaso",
        exercises: [
          { name: "Lectura de apuntes", duration: 20 },
          { name: "Subrayado de ideas clave", duration: 10 },
        ],
      },
      {
        name: "Práctica",
        exercises: [
          { name: "Resolver ejercicios", duration: 25 },
          { name: "Corregir errores", duration: 10 },
        ],
      },
      {
        name: "Cierre",
        exercises: [
          { name: "Resumen final", duration: 10 },
        ],
      },
    ],
  },
  {
    id: "est-lectura-notas",
    name: "Lectura y notas",
    category: "Estudio",
    description: "Para leer, resumir y consolidar conocimiento.",
    color: "#06b6d4",
    icon: "book-open",
    frequencyPerWeek: 6,
    estimatedMinutes: 50,
    defaultPriority: "2",
    defaultType: "Hábito",
    defaultScheduleMode: "dailySame",
    primaryObjectives: ["habit"],
    secondaryObjectives: ["project"],
    flexibilityTags: ["lectura", "notas", "consolidación"],
    defaultPlan: [
      {
        name: "Lectura",
        exercises: [
          { name: "Lectura principal", duration: 20 },
          { name: "Lectura complementaria", duration: 10 },
        ],
      },
      {
        name: "Notas",
        exercises: [
          { name: "Escribir resumen", duration: 15 },
          { name: "Repasar conceptos", duration: 5 },
        ],
      },
    ],
  },
  {
    id: "est-examen-final",
    name: "Preparación de examen",
    category: "Estudio",
    description: "Plan estructurado para parciales o exámenes finales.",
    color: "#06b6d4",
    icon: "book-open",
    frequencyPerWeek: 3,
    estimatedMinutes: 90,
    defaultPriority: "1",
    defaultType: "Proyecto",
    defaultScheduleMode: "weeklyPlan",
    primaryObjectives: ["exam"],
    secondaryObjectives: ["project"],
    flexibilityTags: ["examen", "simulacro", "deadline"],
    defaultPlan: [
      {
        name: "Diagnóstico",
        exercises: [
          { name: "Identificar temas débiles", duration: 15 },
          { name: "Revisar temario", duration: 10 },
        ],
      },
      {
        name: "Estudio fuerte",
        exercises: [
          { name: "Tema 1", duration: 20 },
          { name: "Tema 2", duration: 20 },
          { name: "Tema 3", duration: 20 },
        ],
      },
      {
        name: "Prueba final",
        exercises: [
          { name: "Simulacro", duration: 15 },
          { name: "Revisión de respuestas", duration: 10 },
        ],
      },
    ],
  },

  /* =========================
     CARRERA
     ========================= */
  {
    id: "car-cv-linkedin",
    name: "CV y LinkedIn",
    category: "Carrera",
    description: "Mejora tu perfil profesional y tu presentación laboral.",
    color: "#f59e0b",
    icon: "briefcase",
    frequencyPerWeek: 2,
    estimatedMinutes: 70,
    defaultPriority: "2",
    defaultType: "Proyecto",
    defaultScheduleMode: "weeklyPlan",
    primaryObjectives: ["career"],
    secondaryObjectives: ["project"],
    flexibilityTags: ["cv", "linkedin", "perfil profesional"],
    defaultPlan: [
      {
        name: "Perfil",
        exercises: [
          { name: "Actualizar CV", duration: 25 },
          { name: "Actualizar LinkedIn", duration: 25 },
        ],
      },
      {
        name: "Cierre",
        exercises: [
          { name: "Revisar logros", duration: 10 },
          { name: "Guardar versión final", duration: 10 },
        ],
      },
    ],
  },
  {
    id: "car-portafolio",
    name: "Portafolio profesional",
    category: "Carrera",
    description: "Construcción o mejora de portafolio de proyectos.",
    color: "#f59e0b",
    icon: "briefcase",
    frequencyPerWeek: 3,
    estimatedMinutes: 90,
    defaultPriority: "1",
    defaultType: "Proyecto",
    defaultScheduleMode: "weeklyPlan",
    primaryObjectives: ["career"],
    secondaryObjectives: ["project"],
    flexibilityTags: ["portafolio", "proyecto", "marca personal"],
    defaultPlan: [
      {
        name: "Estructura",
        exercises: [
          { name: "Definir secciones", duration: 20 },
          { name: "Ordenar proyectos", duration: 20 },
        ],
      },
      {
        name: "Contenido",
        exercises: [
          { name: "Redactar descripción de proyecto 1", duration: 20 },
          { name: "Redactar descripción de proyecto 2", duration: 20 },
        ],
      },
      {
        name: "Pulido",
        exercises: [
          { name: "Revisar diseño", duration: 10 },
          { name: "Corregir detalles", duration: 10 },
        ],
      },
    ],
  },
  {
    id: "car-postulaciones",
    name: "Postulaciones semanales",
    category: "Carrera",
    description: "Rutina para aplicar a vacantes de forma constante.",
    color: "#f59e0b",
    icon: "briefcase",
    frequencyPerWeek: 4,
    estimatedMinutes: 60,
    defaultPriority: "1",
    defaultType: "Hábito",
    defaultScheduleMode: "weeklyPlan",
    primaryObjectives: ["career"],
    secondaryObjectives: ["habit"],
    flexibilityTags: ["postulaciones", "búsqueda", "constancia"],
    defaultPlan: [
      {
        name: "Búsqueda",
        exercises: [
          { name: "Buscar vacantes", duration: 20 },
          { name: "Filtrar vacantes", duration: 10 },
        ],
      },
      {
        name: "Aplicación",
        exercises: [
          { name: "Personalizar CV", duration: 15 },
          { name: "Enviar aplicación", duration: 15 },
        ],
      },
    ],
  },
  {
    id: "car-entrevista",
    name: "Preparación de entrevista",
    category: "Carrera",
    description: "Ensaya respuestas y fortalece tu narrativa profesional.",
    color: "#f59e0b",
    icon: "briefcase",
    frequencyPerWeek: 2,
    estimatedMinutes: 50,
    defaultPriority: "2",
    defaultType: "Proyecto",
    defaultScheduleMode: "weeklyPlan",
    primaryObjectives: ["career"],
    secondaryObjectives: ["project"],
    flexibilityTags: ["entrevista", "preparación", "práctica"],
    defaultPlan: [
      {
        name: "Preparación",
        exercises: [
          { name: "Investigar empresa", duration: 15 },
          { name: "Preparar respuestas", duration: 15 },
        ],
      },
      {
        name: "Práctica",
        exercises: [
          { name: "Simular entrevista", duration: 15 },
          { name: "Corregir respuestas", duration: 5 },
        ],
      },
    ],
  },

  /* =========================
     SALUD
     ========================= */
  {
    id: "sal-sueno-rutina",
    name: "Sueño y rutina nocturna",
    category: "Salud",
    description: "Mejora descanso con hábitos previos al sueño.",
    color: "#10b981",
    icon: "heart",
    frequencyPerWeek: 7,
    estimatedMinutes: 30,
    defaultPriority: "1",
    defaultType: "Hábito",
    defaultScheduleMode: "dailySame",
    primaryObjectives: ["wellness"],
    secondaryObjectives: ["habit"],
    flexibilityTags: ["sueño", "descanso", "rutina nocturna"],
    defaultPlan: [
      {
        name: "Desconexión",
        exercises: [
          { name: "Apagar pantallas", duration: 10 },
          { name: "Organizar mañana siguiente", duration: 5 },
        ],
      },
      {
        name: "Relajación",
        exercises: [
          { name: "Respiración", duration: 5 },
          { name: "Lectura ligera", duration: 10 },
        ],
      },
    ],
  },
  {
    id: "sal-hidratacion-alimentacion",
    name: "Hidratación y alimentación",
    category: "Salud",
    description: "Control diario de agua y comidas más conscientes.",
    color: "#10b981",
    icon: "heart",
    frequencyPerWeek: 7,
    estimatedMinutes: 25,
    defaultPriority: "1",
    defaultType: "Hábito",
    defaultScheduleMode: "dailySame",
    primaryObjectives: ["wellness"],
    secondaryObjectives: ["habit"],
    flexibilityTags: ["hidratación", "nutrición", "registro"],
    defaultPlan: [
      {
        name: "Hidratación",
        exercises: [
          { name: "Tomar agua al despertar", duration: 2 },
          { name: "Tomar agua media mañana", duration: 2 },
          { name: "Tomar agua media tarde", duration: 2 },
        ],
      },
      {
        name: "Alimentación",
        exercises: [
          { name: "Preparar comida balanceada", duration: 10 },
          { name: "Registrar lo consumido", duration: 9 },
        ],
      },
    ],
  },
  {
    id: "sal-caminata-pausas",
    name: "Caminata y pausas activas",
    category: "Salud",
    description: "Reduce sedentarismo con movimiento distribuido.",
    color: "#10b981",
    icon: "heart",
    frequencyPerWeek: 5,
    estimatedMinutes: 40,
    defaultPriority: "2",
    defaultType: "Hábito",
    defaultScheduleMode: "weeklyPlan",
    primaryObjectives: ["wellness"],
    secondaryObjectives: ["mobility", "habit"],
    flexibilityTags: ["caminata", "movimiento", "pausas activas"],
    defaultPlan: [
      {
        name: "Movimiento",
        exercises: [
          { name: "Caminata ligera", duration: 20 },
          { name: "Pausa activa 1", duration: 5 },
          { name: "Pausa activa 2", duration: 5 },
        ],
      },
      {
        name: "Cierre",
        exercises: [
          { name: "Estiramiento", duration: 10 },
        ],
      },
    ],
  },
  {
    id: "sal-autocuidado",
    name: "Chequeo y autocuidado",
    category: "Salud",
    description: "Revisión general de bienestar físico y mental.",
    color: "#10b981",
    icon: "heart",
    frequencyPerWeek: 3,
    estimatedMinutes: 45,
    defaultPriority: "2",
    defaultType: "Meta",
    defaultScheduleMode: "weeklyPlan",
    primaryObjectives: ["wellness"],
    secondaryObjectives: ["habit"],
    flexibilityTags: ["autocuidado", "bienestar", "chequeo"],
    defaultPlan: [
      {
        name: "Chequeo",
        exercises: [
          { name: "Revisar energía del día", duration: 5 },
          { name: "Revisar estado emocional", duration: 5 },
        ],
      },
      {
        name: "Autocuidado",
        exercises: [
          { name: "Actividad relajante", duration: 15 },
          { name: "Orden personal", duration: 10 },
          { name: "Plan de descanso", duration: 10 },
        ],
      },
    ],
  },

  /* =========================
     FINANZAS
     ========================= */
  {
    id: "fin-presupuesto",
    name: "Presupuesto mensual",
    category: "Finanzas",
    description: "Controla ingresos, gastos y categorías de consumo.",
    color: "#8b5cf6",
    icon: "dollar-sign",
    frequencyPerWeek: 1,
    estimatedMinutes: 60,
    defaultPriority: "1",
    defaultType: "Proyecto",
    defaultScheduleMode: "weeklyPlan",
    primaryObjectives: ["finance"],
    secondaryObjectives: ["project"],
    flexibilityTags: ["presupuesto", "gastos", "mensual"],
    defaultPlan: [
      {
        name: "Recolección",
        exercises: [
          { name: "Revisar ingresos", duration: 15 },
          { name: "Revisar gastos", duration: 15 },
        ],
      },
      {
        name: "Organización",
        exercises: [
          { name: "Clasificar gastos", duration: 15 },
          { name: "Definir presupuesto", duration: 15 },
        ],
      },
    ],
  },
  {
    id: "fin-ahorro-inversion",
    name: "Ahorro e inversión",
    category: "Finanzas",
    description: "Construye un plan constante de ahorro e inversión.",
    color: "#8b5cf6",
    icon: "dollar-sign",
    frequencyPerWeek: 2,
    estimatedMinutes: 50,
    defaultPriority: "2",
    defaultType: "Hábito",
    defaultScheduleMode: "weeklyPlan",
    primaryObjectives: ["finance"],
    secondaryObjectives: ["habit"],
    flexibilityTags: ["ahorro", "inversión", "constancia"],
    defaultPlan: [
      {
        name: "Ahorro",
        exercises: [
          { name: "Separar ahorro fijo", duration: 10 },
          { name: "Revisar objetivo financiero", duration: 10 },
        ],
      },
      {
        name: "Inversión",
        exercises: [
          { name: "Investigar opción", duration: 15 },
          { name: "Registrar aporte", duration: 15 },
        ],
      },
    ],
  },
  {
    id: "fin-deudas",
    name: "Control de deudas",
    category: "Finanzas",
    description: "Seguimiento para pagos y reducción de deuda.",
    color: "#8b5cf6",
    icon: "dollar-sign",
    frequencyPerWeek: 2,
    estimatedMinutes: 45,
    defaultPriority: "1",
    defaultType: "Proyecto",
    defaultScheduleMode: "weeklyPlan",
    primaryObjectives: ["finance"],
    secondaryObjectives: ["project"],
    flexibilityTags: ["deudas", "pagos", "seguimiento"],
    defaultPlan: [
      {
        name: "Diagnóstico",
        exercises: [
          { name: "Listar deudas", duration: 10 },
          { name: "Revisar fechas de pago", duration: 10 },
        ],
      },
      {
        name: "Acción",
        exercises: [
          { name: "Definir pago prioritario", duration: 10 },
          { name: "Registrar avance", duration: 15 },
        ],
      },
    ],
  },
  {
    id: "fin-educacion",
    name: "Educación financiera",
    category: "Finanzas",
    description: "Aprende conceptos básicos para manejar mejor tu dinero.",
    color: "#8b5cf6",
    icon: "dollar-sign",
    frequencyPerWeek: 3,
    estimatedMinutes: 40,
    defaultPriority: "2",
    defaultType: "Hábito",
    defaultScheduleMode: "dailySame",
    primaryObjectives: ["finance"],
    secondaryObjectives: ["habit"],
    flexibilityTags: ["educación", "aprendizaje", "finanzas"],
    defaultPlan: [
      {
        name: "Aprendizaje",
        exercises: [
          { name: "Leer artículo o ver video", duration: 20 },
          { name: "Tomar notas", duration: 10 },
        ],
      },
      {
        name: "Aplicación",
        exercises: [
          { name: "Escribir aprendizaje clave", duration: 10 },
        ],
      },
    ],
  },

  /* =========================
     OTRO
     ========================= */
  {
    id: "otro-orden",
    name: "Orden personal y del espacio",
    category: "Otro",
    description: "Organiza tu entorno para reducir fricción diaria.",
    color: "#6b7280",
    icon: "target",
    frequencyPerWeek: 3,
    estimatedMinutes: 30,
    defaultPriority: "2",
    defaultType: "Hábito",
    defaultScheduleMode: "dailySame",
    defaultPlan: [
      {
        name: "Orden",
        exercises: [
          { name: "Organizar escritorio", duration: 10 },
          { name: "Organizar archivos", duration: 10 },
        ],
      },
      {
        name: "Cierre",
        exercises: [
          { name: "Limpiar superficie", duration: 5 },
          { name: "Revisar pendientes", duration: 5 },
        ],
      },
    ],
  },
  {
    id: "otro-habito",
    name: "Hábito personal",
    category: "Otro",
    description: "Una meta flexible para hábitos que no encajan en otra categoría.",
    color: "#6b7280",
    icon: "target",
    frequencyPerWeek: 5,
    estimatedMinutes: 25,
    defaultPriority: "2",
    defaultType: "Hábito",
    defaultScheduleMode: "dailySame",
    defaultPlan: [
      {
        name: "Inicio",
        exercises: [
          { name: "Revisión del hábito", duration: 5 },
          { name: "Preparación", duration: 5 },
        ],
      },
      {
        name: "Práctica",
        exercises: [
          { name: "Aplicar hábito", duration: 10 },
          { name: "Registrar avance", duration: 5 },
        ],
      },
    ],
  },
  {
    id: "otro-aprendizaje",
    name: "Aprender algo nuevo",
    category: "Otro",
    description: "Meta general para cualquier habilidad o hobby.",
    color: "#6b7280",
    icon: "target",
    frequencyPerWeek: 3,
    estimatedMinutes: 45,
    defaultPriority: "2",
    defaultType: "Proyecto",
    defaultScheduleMode: "weeklyPlan",
    defaultPlan: [
      {
        name: "Exploración",
        exercises: [
          { name: "Investigar tema", duration: 15 },
          { name: "Elegir recurso", duration: 10 },
        ],
      },
      {
        name: "Práctica",
        exercises: [
          { name: "Practicar habilidad", duration: 15 },
          { name: "Tomar notas", duration: 5 },
        ],
      },
    ],
  },
  {
    id: "otro-productividad",
    name: "Productividad semanal",
    category: "Otro",
    description: "Revisa metas, pendientes y enfoque de la semana.",
    color: "#6b7280",
    icon: "target",
    frequencyPerWeek: 1,
    estimatedMinutes: 50,
    defaultPriority: "1",
    defaultType: "Proyecto",
    defaultScheduleMode: "weeklyPlan",
    defaultPlan: [
      {
        name: "Revisión",
        exercises: [
          { name: "Revisar metas activas", duration: 15 },
          { name: "Revisar pendientes", duration: 10 },
        ],
      },
      {
        name: "Planificación",
        exercises: [
          { name: "Definir prioridades", duration: 15 },
          { name: "Bloquear tiempo", duration: 10 },
        ],
      },
    ],
  },
  {
    id: "est-idioma-rotativo",
    name: "Idioma semanal rotativo",
    category: "Estudio",
    subCategory: "Lectura",
    description: "Plan equilibrado para vocabulario, escucha, conversación y repaso.",
    color: "#06b6d4",
    icon: "book-open",
    frequencyPerWeek: 5,
    estimatedMinutes: 45,
    defaultPriority: "2",
    defaultType: "Hábito",
    defaultScheduleMode: "rotating",
    primaryObjectives: ["habit"],
    secondaryObjectives: ["project"],
    flexibilityTags: ["idioma", "vocabulario", "escucha", "conversación"],
    defaultPlan: [
      {
        name: "Vocabulario",
        exercises: [
          { name: "Aprender 15 palabras", duration: 15 },
          { name: "Crear frases propias", duration: 15 },
          { name: "Repasar tarjetas", duration: 15 },
        ],
      },
      {
        name: "Escucha",
        exercises: [
          { name: "Escuchar audio corto", duration: 15 },
          { name: "Anotar expresiones", duration: 15 },
          { name: "Repetición en voz alta", duration: 10 },
        ],
      },
      {
        name: "Conversación",
        exercises: [
          { name: "Responder preguntas comunes", duration: 15 },
          { name: "Grabar práctica oral", duration: 10 },
          { name: "Corregir pronunciación", duration: 10 },
        ],
      },
    ],
  },
  {
    id: "est-proyecto-investigacion",
    name: "Proyecto de investigación",
    category: "Estudio",
    subCategory: "Repaso",
    description: "Estructura para investigar, sintetizar y entregar un tema complejo.",
    color: "#06b6d4",
    icon: "book-open",
    frequencyPerWeek: 4,
    estimatedMinutes: 70,
    defaultPriority: "1",
    defaultType: "Proyecto",
    defaultScheduleMode: "rotating",
    primaryObjectives: ["project"],
    secondaryObjectives: ["habit"],
    flexibilityTags: ["investigación", "entrega", "síntesis", "proyecto"],
    defaultPlan: [
      {
        name: "Investigación",
        exercises: [
          { name: "Buscar fuentes", duration: 20 },
          { name: "Leer fuente principal", duration: 25 },
          { name: "Guardar citas clave", duration: 10 },
        ],
      },
      {
        name: "Síntesis",
        exercises: [
          { name: "Mapa de ideas", duration: 20 },
          { name: "Resumen propio", duration: 25 },
          { name: "Lista de dudas", duration: 10 },
        ],
      },
      {
        name: "Entrega",
        exercises: [
          { name: "Redactar avance", duration: 30 },
          { name: "Revisar claridad", duration: 15 },
          { name: "Preparar siguiente bloque", duration: 10 },
        ],
      },
    ],
  },
  {
    id: "car-networking",
    name: "Networking profesional",
    category: "Carrera",
    subCategory: "Postulaciones",
    description: "Plan para crear contactos, conversaciones y oportunidades reales.",
    color: "#f59e0b",
    icon: "briefcase",
    frequencyPerWeek: 3,
    estimatedMinutes: 50,
    defaultPriority: "2",
    defaultType: "Hábito",
    defaultScheduleMode: "rotating",
    primaryObjectives: ["career"],
    secondaryObjectives: ["habit"],
    flexibilityTags: ["networking", "contactos", "oportunidades", "mensajes"],
    defaultPlan: [
      {
        name: "Buscar contactos",
        exercises: [
          { name: "Identificar 5 perfiles", duration: 15 },
          { name: "Guardar contexto de cada perfil", duration: 10 },
        ],
      },
      {
        name: "Contactar",
        exercises: [
          { name: "Enviar 2 mensajes personalizados", duration: 20 },
          { name: "Registrar respuestas", duration: 10 },
        ],
      },
      {
        name: "Seguimiento",
        exercises: [
          { name: "Responder conversaciones abiertas", duration: 20 },
          { name: "Actualizar oportunidades", duration: 10 },
        ],
      },
    ],
  },
  {
    id: "car-skill-upgrade",
    name: "Mejora de habilidad profesional",
    category: "Carrera",
    subCategory: "General",
    description: "Plan para aprender una habilidad útil y convertirla en evidencia profesional.",
    color: "#f59e0b",
    icon: "briefcase",
    frequencyPerWeek: 4,
    estimatedMinutes: 65,
    defaultPriority: "1",
    defaultType: "Proyecto",
    defaultScheduleMode: "rotating",
    primaryObjectives: ["career"],
    secondaryObjectives: ["project"],
    flexibilityTags: ["habilidad", "curso", "práctica", "evidencia"],
    defaultPlan: [
      {
        name: "Aprendizaje",
        exercises: [
          { name: "Ver clase o leer guía", duration: 25 },
          { name: "Tomar notas aplicables", duration: 10 },
        ],
      },
      {
        name: "Práctica",
        exercises: [
          { name: "Ejercicio práctico", duration: 30 },
          { name: "Corregir errores", duration: 15 },
        ],
      },
      {
        name: "Evidencia",
        exercises: [
          { name: "Documentar resultado", duration: 20 },
          { name: "Publicar o guardar demo", duration: 15 },
        ],
      },
    ],
  },
  {
    id: "sal-meditacion-estres",
    name: "Manejo de estrés",
    category: "Salud",
    subCategory: "Autocuidado",
    description: "Rutina suave para respiración, pausa mental y descarga emocional.",
    color: "#10b981",
    icon: "heart",
    frequencyPerWeek: 5,
    estimatedMinutes: 25,
    defaultPriority: "2",
    defaultType: "Hábito",
    defaultScheduleMode: "rotating",
    primaryObjectives: ["wellness"],
    secondaryObjectives: ["habit"],
    flexibilityTags: ["estrés", "meditación", "respiración", "calma"],
    defaultPlan: [
      {
        name: "Respiración",
        exercises: [
          { name: "Respiración 4-7-8", duration: 6 },
          { name: "Chequeo corporal", duration: 8 },
        ],
      },
      {
        name: "Descarga",
        exercises: [
          { name: "Escritura libre", duration: 10 },
          { name: "Identificar tensión principal", duration: 5 },
        ],
      },
      {
        name: "Recuperación",
        exercises: [
          { name: "Paseo corto o pausa activa", duration: 12 },
          { name: "Plan de descanso", duration: 5 },
        ],
      },
    ],
  },
  {
    id: "sal-nutricion-semanal",
    name: "Nutrición semanal simple",
    category: "Salud",
    subCategory: "Nutrición",
    description: "Plan para organizar comidas, compras y registro sin complicarse.",
    color: "#10b981",
    icon: "heart",
    frequencyPerWeek: 3,
    estimatedMinutes: 45,
    defaultPriority: "2",
    defaultType: "Proyecto",
    defaultScheduleMode: "rotating",
    primaryObjectives: ["wellness"],
    secondaryObjectives: ["habit"],
    flexibilityTags: ["nutrición", "comidas", "compras", "registro"],
    defaultPlan: [
      {
        name: "Planear comidas",
        exercises: [
          { name: "Elegir comidas base", duration: 15 },
          { name: "Definir proteína y vegetales", duration: 10 },
        ],
      },
      {
        name: "Preparar",
        exercises: [
          { name: "Lista de compras", duration: 10 },
          { name: "Preparación simple", duration: 25 },
        ],
      },
      {
        name: "Revisar",
        exercises: [
          { name: "Registrar comidas", duration: 10 },
          { name: "Ajustar siguiente semana", duration: 10 },
        ],
      },
    ],
  },
  {
    id: "fin-revision-semanal",
    name: "Revisión financiera semanal",
    category: "Finanzas",
    subCategory: "Presupuesto",
    description: "Control ligero para saber en qué va tu dinero cada semana.",
    color: "#8b5cf6",
    icon: "dollar-sign",
    frequencyPerWeek: 2,
    estimatedMinutes: 40,
    defaultPriority: "2",
    defaultType: "Hábito",
    defaultScheduleMode: "rotating",
    primaryObjectives: ["finance"],
    secondaryObjectives: ["habit"],
    flexibilityTags: ["presupuesto", "gastos", "revisión semanal"],
    defaultPlan: [
      {
        name: "Registrar",
        exercises: [
          { name: "Anotar gastos recientes", duration: 15 },
          { name: "Separar gastos fijos y variables", duration: 10 },
        ],
      },
      {
        name: "Decidir",
        exercises: [
          { name: "Comparar contra presupuesto", duration: 10 },
          { name: "Elegir ajuste de la semana", duration: 10 },
        ],
      },
    ],
  },
  {
    id: "fin-reto-ahorro",
    name: "Reto de ahorro",
    category: "Finanzas",
    subCategory: "Ahorro",
    description: "Sistema simple para ahorrar con seguimiento y pequeñas decisiones.",
    color: "#8b5cf6",
    icon: "dollar-sign",
    frequencyPerWeek: 3,
    estimatedMinutes: 30,
    defaultPriority: "2",
    defaultType: "Hábito",
    defaultScheduleMode: "rotating",
    primaryObjectives: ["finance"],
    secondaryObjectives: ["habit"],
    flexibilityTags: ["ahorro", "reto", "seguimiento", "constancia"],
    defaultPlan: [
      {
        name: "Aportar",
        exercises: [
          { name: "Separar monto definido", duration: 5 },
          { name: "Registrar aporte", duration: 5 },
        ],
      },
      {
        name: "Reducir gasto",
        exercises: [
          { name: "Detectar gasto evitable", duration: 10 },
          { name: "Mover ahorro equivalente", duration: 5 },
        ],
      },
      {
        name: "Revisar progreso",
        exercises: [
          { name: "Actualizar total ahorrado", duration: 10 },
          { name: "Definir siguiente aporte", duration: 5 },
        ],
      },
    ],
  },
  {
    id: "otro-journaling",
    name: "Journaling y claridad mental",
    category: "Otro",
    subCategory: "Hábito",
    description: "Rutina para ordenar ideas, emociones y decisiones de la semana.",
    color: "#6b7280",
    icon: "target",
    frequencyPerWeek: 4,
    estimatedMinutes: 25,
    defaultPriority: "2",
    defaultType: "Hábito",
    defaultScheduleMode: "rotating",
    primaryObjectives: ["habit"],
    secondaryObjectives: ["custom"],
    flexibilityTags: ["journaling", "claridad", "reflexión", "hábito"],
    defaultPlan: [
      {
        name: "Reflexión",
        exercises: [
          { name: "Escribir cómo va el día", duration: 8 },
          { name: "Nombrar emoción principal", duration: 5 },
        ],
      },
      {
        name: "Decisión",
        exercises: [
          { name: "Elegir una prioridad", duration: 5 },
          { name: "Definir siguiente acción", duration: 5 },
        ],
      },
    ],
  },
  {
    id: "otro-creativo",
    name: "Proyecto creativo",
    category: "Otro",
    subCategory: "Productividad",
    description: "Plan para escribir, diseñar, crear contenido o avanzar en una obra personal.",
    color: "#6b7280",
    icon: "target",
    frequencyPerWeek: 3,
    estimatedMinutes: 60,
    defaultPriority: "2",
    defaultType: "Proyecto",
    defaultScheduleMode: "rotating",
    primaryObjectives: ["project"],
    secondaryObjectives: ["habit"],
    flexibilityTags: ["creatividad", "contenido", "escritura", "proyecto"],
    defaultPlan: [
      {
        name: "Idea",
        exercises: [
          { name: "Recolectar referencias", duration: 15 },
          { name: "Definir enfoque", duration: 10 },
        ],
      },
      {
        name: "Producción",
        exercises: [
          { name: "Crear borrador", duration: 30 },
          { name: "Guardar avance", duration: 5 },
        ],
      },
      {
        name: "Pulido",
        exercises: [
          { name: "Editar detalles", duration: 20 },
          { name: "Preparar publicación o archivo", duration: 10 },
        ],
      },
    ],
  },
];

