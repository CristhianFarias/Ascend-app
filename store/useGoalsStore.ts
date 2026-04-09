// src/store/useGoalsStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  buildItineraryForDate,
  computeItinerarySummary,
  detectConflicts,
  findNextItem,
  ItineraryItem,
  normalizeItinerary,
} from "./ItineraryUtils";

/* ============================
   TIPOS y CONSTANTES
   ============================ */
export type GoalCategory =
  | "Fitness"
  | "Estudio"
  | "Carrera"
  | "Salud"
  | "Finanzas"
  | "Otro";
  export type WorkoutEnvironment = "Casa" | "Gimnasio" | "Mixto";
export type GoalPriority = "1" | "2" | "3";
export type GoalType = "Proyecto" | "Meta" | "Hábito";
export type TimeBlock = { start: string; end: string };

export type Step = {
  id: string;
  title: string;
  duration: number; // minutes
  completed: boolean;
  order: number;
  scheduledTime?: string;
  sets?: number;
  reps?: number;
  rest?: number;
  session?: string;
  metadata?: Record<string, any>;
};

export type GoalStatus = "active" | "paused" | "completed" | "archived";

export type TemplateExercise = {
  name: string;
  sets?: number;
  reps?: number;
  rest?: number;
  duration?: number; // minutes
  order?: number;
  muscles?: string[];
  metadata?: Record<string, any>;
};

export type TemplateSession = {
  name: string;
  exercises: TemplateExercise[];
  order?: number;
};

export type GoalTemplate = {
  id: string;
  name: string;
  category: GoalCategory;
  subCategory?: string;
  description?: string;
  color?: string;
  icon?: string;
  frequencyPerWeek?: number;
  muscleGroups?: string[];
  estimatedMinutes?: number;
  defaultScheduleMode?: "dailySame" | "weeklyPlan" | "rotating";
  defaultPlan?: TemplateSession[];
  defaultPriority?: GoalPriority;
  defaultType?: GoalType;
  metadata?: Record<string, any>;
  workoutStyle?: string;
workoutEnvironment?: WorkoutEnvironment;
environmentPlans?: Partial<Record<WorkoutEnvironment, TemplateSession[]>>;
};

export type Goal = {
  id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  priority: GoalPriority;
  type: GoalType;
  color: string;
  icon?: string;
  deadline?: string;
  status: GoalStatus;
  scheduleMode: "dailySame" | "weeklyPlan" | "rotating";
  templateId?: string;
  timeBlocks?: TimeBlock[];
  steps: Step[];
  plan?: TemplateSession[];
  totalFocusMinutes: number;
  order: number;
  muscleGroups?: string[];
  completedDates?: string[];
  workoutStyle?: string;
workoutEnvironment?: WorkoutEnvironment;
};

type FocusPhase = "work" | "rest" | "idle";

export type FocusSession = {
  running: boolean;
  goalId: string;
  stepId: string;
  stepIndex: number;
  phase: FocusPhase;
  remainingSeconds: number;
  currentSet: number;
  totalSets: number;
  restSeconds: number;
  startedAt: number;
  lastTickAt: number;
  autoAdvance?: boolean;
  autoMark?: boolean;
};

export type ScheduleBlock = {
  id: string;
  goalId: string;
  goalTitle: string;
  start: string;
  end: string;
  minutes: number;
  stepId?: string;
};

export type HeatmapItem = {
  date: string;
  completed: boolean;
  count: number;
  goalIds: string[];
};

type Conflict = {
  item1: ItineraryItem;
  item2: ItineraryItem;
  overlapMinutes: number;
};

/* ============================
   META CATEGORÍAS
   ============================ */
export const CATEGORY_META: Record<
  GoalCategory,
  { icon: string; color: string; label?: string }
> = {
  Fitness: { icon: "activity", color: "#ef4444", label: "Fitness" },
  Estudio: { icon: "book-open", color: "#06b6d4", label: "Estudio" },
  Carrera: { icon: "briefcase", color: "#f59e0b", label: "Carrera" },
  Salud: { icon: "heart", color: "#10b981", label: "Salud" },
  Finanzas: { icon: "dollar-sign", color: "#8b5cf6", label: "Finanzas" },
  Otro: { icon: "target", color: "#6b7280", label: "Otro" },
};
const DEFAULT_TEMPLATES: GoalTemplate[] = [
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
];

/* ============================
   HELPERS PUROS
   ============================ */
const genId = (prefix = "") =>
  `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

const timeStrToMinutes = (t: string) => {
  const [h = "0", m = "0"] = (t || "").split(":");
  const hn = Number(h) || 0;
  const mn = Number(m) || 0;
  return hn * 60 + mn;
};

const minutesToTimeStr = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = Math.max(0, mins % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const getTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const parseYYYYMMDD = (s: string) => {
  const [y, m, d] = (s || "").split("-").map((x) => Number(x) || 0);
  return new Date(y, m - 1, d);
};
const formatYYYYMMDD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/* ============================
   NORMALIZERS
   ============================ */
const normalizeStep = (raw: any): Step => ({
  id: typeof raw?.id === "string" && raw.id ? raw.id : genId("step-"),
  title: typeof raw?.title === "string" ? raw.title : "Paso",
  duration: typeof raw?.duration === "number" ? raw.duration : 5,
  completed: Boolean(raw?.completed),
  order: typeof raw?.order === "number" ? raw.order : 0,
  scheduledTime:
    typeof raw?.scheduledTime === "string" ? raw.scheduledTime : undefined,
  sets: typeof raw?.sets === "number" ? raw.sets : undefined,
  reps: typeof raw?.reps === "number" ? raw.reps : undefined,
  rest: typeof raw?.rest === "number" ? raw.rest : undefined,
  session: typeof raw?.session === "string" ? raw.session : undefined,
  metadata: typeof raw?.metadata === "object" ? raw.metadata : {},
});

const normalizeGoal = (raw: any): Goal => {
  const gid = typeof raw?.id === "string" && raw.id ? raw.id : genId("goal-");
  const steps = Array.isArray(raw?.steps) ? raw.steps.map(normalizeStep) : [];
  const cat = (raw?.category as GoalCategory) ?? "Otro";
  const meta = CATEGORY_META[cat] ?? CATEGORY_META["Otro"];
  return {
    id: gid,
    title: typeof raw?.title === "string" ? raw.title : "Nueva Meta",
    description:
      typeof raw?.description === "string" ? raw.description : undefined,
    category: cat,
    priority: (raw?.priority as GoalPriority) ?? "2",
    type: (raw?.type as GoalType) ?? "Meta",
    color: typeof raw?.color === "string" ? raw.color : meta.color,
    icon: typeof raw?.icon === "string" ? raw.icon : meta.icon,
    deadline: typeof raw?.deadline === "string" ? raw.deadline : undefined,
    status: (raw?.status as GoalStatus) ?? "active",
    scheduleMode: (raw?.scheduleMode as Goal["scheduleMode"]) ?? "dailySame",
    templateId:
      typeof raw?.templateId === "string" ? raw.templateId : undefined,
    timeBlocks: Array.isArray(raw?.timeBlocks) ? raw.timeBlocks : undefined,
    steps,
    plan: Array.isArray(raw?.plan) ? raw.plan : undefined,
    totalFocusMinutes:
      typeof raw?.totalFocusMinutes === "number"
        ? raw.totalFocusMinutes
        : steps.reduce((a: number, b: Step) => a + (b.duration || 0), 0),
    order: typeof raw?.order === "number" ? raw.order : Date.now(),
    muscleGroups: Array.isArray(raw?.muscleGroups)
      ? raw.muscleGroups
      : undefined,
      workoutStyle:
  typeof raw?.workoutStyle === "string" ? raw.workoutStyle : undefined,
workoutEnvironment:
  raw?.workoutEnvironment === "Casa" ||
  raw?.workoutEnvironment === "Gimnasio" ||
  raw?.workoutEnvironment === "Mixto"
    ? raw.workoutEnvironment
    : undefined,
    completedDates: Array.isArray(raw?.completedDates)
      ? raw.completedDates
      : [],
  };
};

/* ============================
   INTERFACE DEL STORE
   ============================ */
export type GoalsState = {
  goalsById: Record<string, Goal>;
  goalIds: string[];
  settings: {
    accentColor: string;
    availableTimeBlocks: TimeBlock[];
    dayStartTime: string;
    dayEndTime: string;
    theme: "light" | "dark" | "system";
    minimalMode: boolean;
  };
  externalEvents: Array<{
    id: string;
    title: string;
    start: string;
    end: string;
  }>;
  dailyCompletionMap: Record<string, string[]>;
  storeVersion: number;
  _version: number;
  templates: GoalTemplate[];
  dailySchedule: ScheduleBlock[];
  dailySchedulesByDate: Record<string, ScheduleBlock[]>;
  hasFinishedOnboarding: boolean;
  focusSession: FocusSession | null;
  _events: Record<string, ((payload?: any) => void)[]>;
  globalStreak: number;
  bestStreak: number;
  lastRolloverDate?: string; // <-- Nueva propiedad

  /* Selectors */
  getGoalsList: () => Goal[];
  getGoalsListMemo: () => Goal[];
  getActiveGoalsMemo: () => Goal[];
  getGoalById: (id: string) => Goal | undefined;
  getTemplatesByCategory: (c: GoalCategory) => GoalTemplate[];
  getCategoryMeta: (c: GoalCategory) => {
    icon: string;
    color: string;
    label?: string;
  };
  getGoalProgress: (id: string) => {
    total: number;
    completed: number;
    percent: number;
  };
  getTodayItinerary: () => ItineraryItem[];
  getTodayItineraryMemo: () => ItineraryItem[];
  getTodayItinerarySummary: () => {
    totalMinutes: number;
    completedMinutes: number;
    percentDone: number;
  };
  getExpandedStepsForBlock: (
  block: ScheduleBlock,
) => { step: Step; start: string; end: string }[];

getMergedScheduleForDate: (date?: string) => ScheduleBlock[];
reorderMergedScheduleForDate: (
  date: string,
  ordered: ScheduleBlock[],
) => ScheduleBlock[];
  findNextItineraryItem: () => ItineraryItem | null;
  getItineraryConflicts: () => Conflict[];
  getGlobalStats: () => ReturnType<typeof buildStats> & {
    recentDays: HeatmapItem[];
  };
  getHeatmapData: (range?: "week" | "month" | "all") => HeatmapItem[];
  areAllStepsCompleted: (goalId: string) => boolean;
  getCompletedGoalsForDate: (date: string) => string[];
  getStreakHistory: (
    range?: "week" | "month" | "all",
  ) => { date: string; streak: number }[];

  /* CRUD y acciones */
  addGoalSafe: (partial: Partial<Goal>) => Goal;
  createGoalFromTemplate: (
    templateId: string,
    overrides?: Partial<Goal>,
  ) => Goal;
  createSmartGoal: (opts: {
    title?: string;
    description?: string;
    minutes?: number;
    templateId?: string;
    type?: GoalType;
    category?: GoalCategory;
    priority?: GoalPriority;
    overrides?: Partial<Goal>;
  }) => Goal;
  updateGoal: (id: string, data: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  addStep: (goalId: string, step: Omit<Step, "id">) => Step;
  updateStep: (goalId: string, stepId: string, data: Partial<Step>) => void;
  setStepsForGoal: (goalId: string, steps: Step[]) => void;
  deleteStep: (goalId: string, stepId: string) => void;
  toggleStep: (goalId: string, stepId: string) => void;
  reorderSteps: (goalId: string, steps: Step[]) => void;
  rescheduleStep: (goalId: string, stepId: string, time: string) => void;
  reorderItinerary: (fromIndex: number, toIndex: number) => void;

  markGoalCompletedToday: (goalId: string) => void;
  unmarkGoalCompletedToday: (goalId: string) => void;
  markTodayCompleteIfEligible: () => boolean;
  recalculateStreaks: () => void;

  startFocus: (
    goalId: string,
    stepId?: string,
    opts?: { seconds?: number; autoAdvance?: boolean; autoMark?: boolean },
  ) => void;
  pauseFocus: () => void;
  resumeFocus: () => void;
  skipSetOrStep: () => void;
  tick: (now?: number) => void;
  finishFocus: () => void;

  on: (e: string, cb: (payload?: any) => void) => void;
  off: (e: string, cb: (payload?: any) => void) => void;
  emit: (e: string, payload?: any) => void;

  setAccentColor: (c: string) => void;
  setAvailableTimeBlocks: (blocks: TimeBlock[]) => void;
  setTheme: (mode: "light" | "dark" | "system") => void;
  setMinimalMode: (v: boolean) => void;
  completeOnboarding: () => void;
  isTodayMarked: () => boolean;
  markTodayComplete: () => void;
  resetAll: () => void;
  backupToJSON: () => string;
  restoreFromJSON: (json: string) => void;

  setDailySchedule: (blocks: ScheduleBlock[]) => void;
  setDailyScheduleForDate: (date: string, blocks: ScheduleBlock[]) => void;
  getDailyScheduleForDate: (date?: string) => ScheduleBlock[];
  getItinerary: (range: "day" | "week", date?: string) => ScheduleBlock[];
  generateScheduleProposal: (date: string) => {
    proposal: ScheduleBlock[];
    warnings: string[];
  };
  validateOverload: (date: string) => {
    ok: boolean;
    warnings: string[];
    deficitMinutes?: number;
  };
  updateScheduleBlock: (
    blockId: string,
    newStart: string,
    newEnd: string,
  ) => void;
  removeScheduleBlock: (blockId: string) => void;

  /* NUEVO: rollover diario */
  performDailyRollover: (today?: string) => {
    rolled: boolean;
    archivedGoals: string[];
  };
  rolloverIfNeeded: (today?: string) => {
    rolled: boolean;
    archivedGoals: string[];
  };
};

/* ============================
   eventsBus (fuera del estado)
   ============================ */
const eventsBus: Record<string, ((payload?: any) => void)[]> = {};
function emitEvent(e: string, payload?: any) {
  (eventsBus[e] || []).forEach((cb) => {
    try {
      cb(payload);
    } catch (err) {
      console.warn("event cb error", err);
    }
  });
}

/* ============================
   STORE
   ============================ */
export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => {
const calculateStreaks = (s: GoalsState) => {
  const map = s.dailyCompletionMap || {};
  const todayKey = getTodayKey();

  const activeGoals = s.goalIds
    .map((id) => s.goalsById[id])
    .filter(
      (g): g is Goal =>
        !!g && g.status === "active" && Array.isArray(g.steps) && g.steps.length > 0,
    )
    .map((g) => g.id);

  if (activeGoals.length === 0) {
    return { globalStreak: 0, bestStreak: 0 };
  }

  const dateHasAllActive = (dateKey: string) => {
    const completed = map[dateKey] ?? [];
    return activeGoals.every((id) => completed.includes(id));
  };

  // Si hoy está completo, la racha actual cuenta desde hoy.
  // Si hoy no está completo, conserva la racha hasta ayer.
  const todayHasAll = dateHasAllActive(todayKey);
  const cursorStart = parseYYYYMMDD(todayKey);
  if (!todayHasAll) cursorStart.setDate(cursorStart.getDate() - 1);

  let globalStreak = 0;
  let cursor = new Date(cursorStart);

  while (true) {
    const key = formatYYYYMMDD(cursor);
    if (!dateHasAllActive(key)) break;
    globalStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Mejor racha histórica
  const dateKeys = Object.keys(map).sort();
  let bestRun = 0;
  let run = 0;
  let prevKey: string | null = null;

  for (const key of dateKeys) {
    if (!dateHasAllActive(key)) {
      run = 0;
      prevKey = null;
      continue;
    }

    if (!prevKey) {
      run = 1;
    } else {
      const prev = parseYYYYMMDD(prevKey);
      prev.setDate(prev.getDate() + 1);
      const expected = formatYYYYMMDD(prev);
      run = expected === key ? run + 1 : 1;
    }

    bestRun = Math.max(bestRun, run);
    prevKey = key;
  }

  return {
    globalStreak,
    bestStreak: Math.max(s.bestStreak || 0, bestRun),
  };
};

/* estado inicial */

      /* estado inicial */
      return {
        goalsById: {},
        goalIds: [],
        settings: {
          accentColor: "#f59e0b",
          availableTimeBlocks: [
            { start: "08:00", end: "12:00" },
            { start: "17:00", end: "20:00" },
          ],
          dayStartTime: "08:00",
          dayEndTime: "22:00",
          theme: "system",
          minimalMode: false,
        },
        externalEvents: [
          { id: "1", title: "Cita Médica", start: "10:00", end: "11:00" },
          { id: "2", title: "Reunión Trabajo", start: "15:00", end: "16:00" },
        ],
        dailyCompletionMap: {},
        storeVersion: 7,
        _version: 0,
        templates: DEFAULT_TEMPLATES,
        dailySchedule: [],
        dailySchedulesByDate: {},
        hasFinishedOnboarding: false,
        focusSession: null,
        _events: {},
        globalStreak: 0,
        bestStreak: 0,
        lastRolloverDate: undefined,

        /* SELECTORES (memoizados por _version) */
        getGoalsList: () => {
          const s = get();
          return s.goalIds.map((id) => s.goalsById[id]).filter(Boolean);
        },

        getGoalsListMemo: (() => {
          let cacheVersion = -1;
          let cacheValue: Goal[] = [];
          return () => {
            const s = get();
            if (s._version === cacheVersion) return cacheValue;
            cacheValue = s.goalIds.map((id) => s.goalsById[id]).filter(Boolean);
            cacheVersion = s._version;
            return cacheValue;
          };
        })(),

        getActiveGoalsMemo: (() => {
          let cacheVersion = -1;
          let cacheValue: Goal[] = [];
          return () => {
            const s = get();
            if (s._version === cacheVersion) return cacheValue;
            cacheValue = s
              .getGoalsListMemo()
              .filter((g) => g.status === "active");
            cacheVersion = s._version;
            return cacheValue;
          };
        })(),

        getGoalById: (id: string) => get().goalsById[id],

        getTemplatesByCategory: (c: GoalCategory) =>
          get().templates.filter((t) => t.category === c),

        getCategoryMeta: (c: GoalCategory) =>
          CATEGORY_META[c] ?? CATEGORY_META["Otro"],

        getGoalProgress: (id: string) => {
          const g = get().goalsById[id];
          if (!g) return { total: 0, completed: 0, percent: 0 };
          const total = g.steps.length;
          const completed = g.steps.filter((s) => s.completed).length;
          return {
            total,
            completed,
            percent: total === 0 ? 0 : Math.round((completed / total) * 100),
          };
        },
getTodayItinerary: () => {
  const s = get();
  const today = getTodayKey();

  // Prioridad: itinerario guardado para hoy
  // Si no existe, se genera desde las metas activas
  const storedForToday = s.getDailyScheduleForDate(today) as any[];

  const raw: Partial<ItineraryItem>[] =
    Array.isArray(storedForToday) && storedForToday.length > 0
      ? storedForToday
      : (buildItineraryForDate(s.getActiveGoalsMemo(), new Date()) as any);

  const norm = normalizeItinerary(raw);

  const annotated = norm.map((it) => {
    const meta = { ...(it.metadata || {}) };

    if (it.stepId && it.goalId) {
      const g = s.goalsById[it.goalId];
      const st = g?.steps?.find((x) => x.id === it.stepId);
      meta.completed = Boolean(st?.completed);
      if (!it.color && g) it.color = g.color;
    } else {
      meta.completed = Boolean(it.metadata?.completed);
      if (!it.color && it.goalId) {
        const g = s.goalsById[it.goalId];
        if (g) it.color = g.color;
      }
    }

    return { ...it, metadata: meta };
  });

  return annotated;
},

        getTodayItineraryMemo: (() => {
          let cacheVersion = -1;
          let cacheValue: ItineraryItem[] = [];
          return () => {
            const s = get();
            if (s._version === cacheVersion) return cacheValue;
            cacheValue = s.getTodayItinerary();
            cacheVersion = s._version;
            return cacheValue;
          };
        })(),

        getTodayItinerarySummary: (() => {
          let cacheVersion = -1;
          let cacheValue = {
            totalMinutes: 0,
            completedMinutes: 0,
            percentDone: 0,
          };
          return () => {
            const s = get();
            if (s._version === cacheVersion) return cacheValue;
            const items = s.getTodayItineraryMemo();
            cacheValue = computeItinerarySummary(items);
            cacheVersion = s._version;
            return cacheValue;
          };
        })(),
        getExpandedStepsForBlock: (block: ScheduleBlock) => {
  const s = get();
  const goal = block.goalId ? s.goalsById[block.goalId] : undefined;

  if (!goal) {
    if (block.stepId) {
      const stepSingle: Step = {
        id: block.stepId,
        title: block.goalTitle || "Paso",
        duration: block.minutes || 1,
        completed: false,
        order: 1,
      };

      return [{ step: stepSingle, start: block.start, end: block.end }];
    }
    return [];
  }

  const blockStartMin = timeStrToMinutes(block.start);
  const blockEndMin = timeStrToMinutes(block.end);
  const blockMinutes = Math.max(1, blockEndMin - blockStartMin);

  const candidates = [...(goal.steps || [])];
  if (candidates.length === 0) return [];

  const totalOriginal =
    candidates.reduce((a, b) => a + (b.duration || 0), 0) || candidates.length;

  const scale = totalOriginal > blockMinutes ? blockMinutes / totalOriginal : 1;

  let cursor = blockStartMin;
  const out: { step: Step; start: string; end: string }[] = [];

  for (const st of candidates) {
    const origDur = Math.max(1, st.duration || 1);
    const assignedDur = Math.max(1, Math.round(origDur * scale));
    const endMin = Math.min(blockEndMin, cursor + assignedDur);

    out.push({
      step: st,
      start: minutesToTimeStr(cursor),
      end: minutesToTimeStr(endMin),
    });

    cursor = endMin;
    if (cursor >= blockEndMin) break;
  }

  return out;
},

getMergedScheduleForDate: (date?: string) => {
  const s = get();
  const key = date ?? getTodayKey();

  const raw: ScheduleBlock[] =
    s.dailySchedulesByDate?.[key]?.length > 0
      ? s.dailySchedulesByDate[key]
      : s.dailySchedule || [];

  const groups: Record<string, ScheduleBlock[]> = {};
  const others: ScheduleBlock[] = [];

  for (const b of raw ?? []) {
    if (!b) continue;
    if (b.id?.startsWith("combined-")) continue;

    if (b.goalId) {
      if (!groups[b.goalId]) groups[b.goalId] = [];
      groups[b.goalId].push(b);
    } else {
      others.push(b);
    }
  }

  const result: ScheduleBlock[] = [...others];

  for (const goalId of Object.keys(groups)) {
    const arr = groups[goalId];
    if (!arr || arr.length === 0) continue;

    const starts = arr.map((x) => timeStrToMinutes(x.start));
    const ends = arr.map((x) => timeStrToMinutes(x.end));
    const minStart = Math.min(...starts);
    const maxEnd = Math.max(...ends);
    const first = arr[0];

    result.push({
      id: `combined-${goalId}`,
      goalId,
      goalTitle: first.goalTitle ?? first.goalId ?? "",
      start: minutesToTimeStr(minStart),
      end: minutesToTimeStr(maxEnd),
      minutes: Math.max(1, Math.round(maxEnd - minStart)),
    } as ScheduleBlock);
  }

  result.sort((a, b) => timeStrToMinutes(a.start) - timeStrToMinutes(b.start));
  return result;
},
reorderMergedScheduleForDate: (date: string, ordered: ScheduleBlock[]) => {
  const s = get();
  const raw: ScheduleBlock[] =
    s.dailySchedulesByDate?.[date]?.length > 0
      ? s.dailySchedulesByDate[date]
      : s.dailySchedule || [];

  const rawMap = new Map<string, ScheduleBlock>();
  const rawByGoal = new Map<string, ScheduleBlock[]>();

  raw.forEach((b) => {
    if (b?.id) rawMap.set(b.id, b);
    if (b?.goalId) {
      const list = rawByGoal.get(b.goalId) || [];
      list.push(b);
      rawByGoal.set(b.goalId, list);
    }
  });

  const flatReordered: ScheduleBlock[] = [];

  ordered.forEach((item) => {
    if (item.id?.startsWith("combined-") && item.goalId) {
      const originals = rawByGoal.get(item.goalId) || [];
      originals.sort((a, b) => timeStrToMinutes(a.start) - timeStrToMinutes(b.start));
      flatReordered.push(...originals);
    } else {
      const original = (item.id && rawMap.get(item.id)) || item;
      flatReordered.push(original);
    }
  });

  if (flatReordered.length === 0) {
    set((st) => ({
      dailySchedulesByDate: {
        ...(st.dailySchedulesByDate || {}),
        [date]: [],
      },
      dailySchedule:
        date === getTodayKey() ? [] : st.dailySchedule,
      _version: st._version + 1,
    }));
    emitEvent("itinerary.changed");
    return [];
  }

  const starts = raw.map((b) => timeStrToMinutes(b.start));
  let cursorMinutes = starts.length > 0 ? Math.min(...starts) : 8 * 60;

  const recalculated = flatReordered.map((block) => {
    const duration =
      block.minutes ||
      timeStrToMinutes(block.end) - timeStrToMinutes(block.start) ||
      30;

    const newStart = minutesToTimeStr(cursorMinutes);
    const newEnd = minutesToTimeStr(cursorMinutes + duration);
    cursorMinutes += duration;

    return {
      ...block,
      start: newStart,
      end: newEnd,
      minutes: duration,
    };
  });

  set((st) => ({
    dailySchedulesByDate: {
      ...(st.dailySchedulesByDate || {}),
      [date]: recalculated,
    },
    dailySchedule: date === getTodayKey() ? recalculated : st.dailySchedule,
    _version: st._version + 1,
  }));

  emitEvent("itinerary.changed");
  return recalculated;
},

        findNextItineraryItem: (() => {
          let cacheVersion = -1;
          let cacheValue: ItineraryItem | null = null;
          return () => {
            const s = get();
            if (s._version === cacheVersion) return cacheValue;
            const items = s.getTodayItineraryMemo();
            cacheValue = findNextItem(items);
            cacheVersion = s._version;
            return cacheValue;
          };
        })(),

        getItineraryConflicts: (() => {
          let cacheVersion = -1;
          let cacheValue: Conflict[] = [];
          return () => {
            const s = get();
            if (s._version === cacheVersion) return cacheValue;
            const items = s.getTodayItineraryMemo();
            cacheValue = detectConflicts(items);
            cacheVersion = s._version;
            return cacheValue;
          };
        })(),

        getGlobalStats: (() => {
          let cacheVersion = -1;
          let cacheValue: any = null;
          return () => {
            const s = get();
            if (s._version === cacheVersion && cacheValue) return cacheValue;
            const base = buildStats(
              s.getGoalsListMemo(),
              s.globalStreak ?? 0,
              s.bestStreak ?? 0,
            );
            const recentDays = s.getHeatmapData("week");
            cacheValue = { ...base, recentDays };
            cacheVersion = s._version;
            return cacheValue;
          };
        })(),

        getHeatmapData: (range = "month") => {
          const s = get();
          const daysBack = range === "week" ? 7 : range === "month" ? 30 : 365;
          const result: HeatmapItem[] = [];
          const today = new Date();
          for (let i = daysBack - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            const goalIds = s.dailyCompletionMap[key] ?? [];
            result.push({
              date: key,
              completed: goalIds.length > 0,
              count: goalIds.length,
              goalIds,
            });
          }
          return result;
        },

        areAllStepsCompleted: (goalId: string) => {
          const g = get().goalsById[goalId];
          if (!g) return false;
          if (!g.steps || g.steps.length === 0) return false;
          return g.steps.every((s) => s.completed);
        },

        getCompletedGoalsForDate: (date: string) =>
          get().dailyCompletionMap[date] ?? [],

        getStreakHistory: (() => {
          const caches: Record<
            string,
            { version: number; value: { date: string; streak: number }[] }
          > = {};
          return (range: "week" | "month" | "all" = "month") => {
            const s = get();
            const key = range;
            if (!caches[key]) caches[key] = { version: -1, value: [] };
            const cache = caches[key];
            if (s._version === cache.version) return cache.value;
            const daysBack =
              range === "week" ? 7 : range === "month" ? 30 : 365;
            const today = new Date();
            const history: { date: string; streak: number }[] = [];
            const map = s.dailyCompletionMap || {};
            const activeGoals = s.goalIds
              .map((id) => s.goalsById[id])
              .filter((g) => g && g.status === "active" && g.steps.length > 0)
              .map((g) => g.id);

            if (activeGoals.length === 0) {
              cache.value = history;
              cache.version = s._version;
              return history;
            }

            const dateHasAllActive = (dstr: string) => {
              const arr = map[dstr] ?? [];
              return activeGoals.every((id) => arr.includes(id));
            };

            for (let i = daysBack - 1; i >= 0; i--) {
              const d = new Date(today);
              d.setDate(today.getDate() - i);
              const keyDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              let streak = 0;
              let checkDate = new Date(d);
              while (true) {
                const checkKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
                if (dateHasAllActive(checkKey)) {
                  streak++;
                  checkDate.setDate(checkDate.getDate() - 1);
                } else {
                  break;
                }
              }
              history.push({ date: keyDate, streak });
            }
            cache.value = history.reverse();
            cache.version = s._version;
            return cache.value;
          };
        })(),

        /* GOALS CRUD */
        addGoalSafe: (partial) => {
          const g = normalizeGoal(partial || {});
          set((s) => ({
            goalsById: { ...s.goalsById, [g.id]: g },
            goalIds: [...s.goalIds, g.id],
            _version: s._version + 1,
          }));
          return g;
        },

createGoalFromTemplate: (templateId, overrides) => {
  const tpl = get().templates.find((t) => t.id === templateId);

  if (!tpl) {
    const fallbackGoal = normalizeGoal({
      ...overrides,
      templateId,
    });

    set((s) => ({
      goalsById: { ...s.goalsById, [fallbackGoal.id]: fallbackGoal },
      goalIds: [...s.goalIds, fallbackGoal.id],
      _version: s._version + 1,
    }));

    emitEvent("goal.createdSmart", {
      goal: fallbackGoal,
      templateId,
      fallback: true,
    });

    return fallbackGoal;
  }

  const usingCustomSteps =
    Array.isArray(overrides?.steps) && overrides.steps.length > 0;

  const builtSteps: Step[] = [];
  const workoutEnvironment =
  (overrides?.workoutEnvironment as WorkoutEnvironment) ??
  tpl.workoutEnvironment ??
  "Mixto";

const plan =
  tpl.environmentPlans?.[workoutEnvironment] ??
  tpl.defaultPlan ??
  [];

  if (usingCustomSteps) {
    builtSteps.push(
      ...((overrides?.steps ?? []) as Step[]).map((st, index) => ({
        ...normalizeStep(st),
        id: typeof st.id === "string" && st.id ? st.id : genId("step-"),
        order: index + 1,
        completed: Boolean(st.completed),
      })),
    );
  } else {
    (tpl.defaultPlan ?? []).forEach((session) => {
      session.exercises.forEach((ex) => {
        builtSteps.push({
          id: genId("step-"),
          title: ex.name ?? "Paso",
          duration: typeof ex.duration === "number" ? ex.duration : 5,
          completed: false,
          order: builtSteps.length + 1,
          sets: typeof ex.sets === "number" ? ex.sets : undefined,
          reps: typeof ex.reps === "number" ? ex.reps : undefined,
          rest: typeof ex.rest === "number" ? ex.rest : undefined,
          session: session.name,
          metadata: ex.metadata ?? {},
        });
      });
    });
  }

  const finalSteps = builtSteps.map((st, index) => ({
    ...normalizeStep(st),
    order: index + 1,
  }));

  const newGoal: Goal = {
    id: genId("goal-"),
    title:
      typeof overrides?.title === "string" && overrides.title.trim()
        ? overrides.title.trim()
        : tpl.name ?? "Nueva Meta",
    description:
      typeof overrides?.description === "string"
        ? overrides.description
        : tpl.description ?? "",
    category: (overrides?.category as GoalCategory) ?? tpl.category ?? "Otro",
    priority:
      (overrides?.priority as GoalPriority) ?? tpl.defaultPriority ?? "2",
    type: (overrides?.type as GoalType) ?? tpl.defaultType ?? "Meta",
    color:
      typeof overrides?.color === "string"
        ? overrides.color
        : tpl.color ?? CATEGORY_META[tpl.category]?.color ?? "#6b7280",
    icon:
      typeof overrides?.icon === "string"
        ? overrides.icon
        : tpl.icon ?? CATEGORY_META[tpl.category]?.icon ?? "target",
    deadline:
      typeof overrides?.deadline === "string" ? overrides.deadline : undefined,
    status: overrides?.status ?? "active",
    scheduleMode: overrides?.scheduleMode ?? tpl.defaultScheduleMode ?? "dailySame",
    templateId,
    timeBlocks: Array.isArray(overrides?.timeBlocks)
      ? overrides.timeBlocks
      : undefined,
    steps: finalSteps,
    plan: Array.isArray(overrides?.plan)
      ? overrides.plan
      : tpl.defaultPlan ?? undefined,
    totalFocusMinutes: finalSteps.reduce((acc, st) => acc + (st.duration || 0), 0),
    order:
      typeof overrides?.order === "number"
        ? overrides.order
        : get().goalIds.length + 1,
    muscleGroups: Array.isArray(tpl.muscleGroups) ? tpl.muscleGroups : undefined,
    workoutStyle: overrides?.workoutStyle ?? tpl.workoutStyle,
workoutEnvironment,
    completedDates: Array.isArray(overrides?.completedDates)
      ? overrides.completedDates
      : [],
  };

  set((s) => ({
    goalsById: { ...s.goalsById, [newGoal.id]: newGoal },
    goalIds: [...s.goalIds, newGoal.id],
    _version: s._version + 1,
  }));

  emitEvent("goal.createdSmart", { goal: newGoal, templateId });
  return newGoal;
},

createSmartGoal: ({
  title,
  description = "",
  minutes = 50,
  templateId,
  type,
  category,
  priority,
  overrides,
}) => {
  if (templateId) {
    return get().createGoalFromTemplate(templateId, {
      title,
      description,
      category,
      priority,
      type,
      ...overrides,
    });
  }

  const blocks: Step[] = [];
  let remaining = Math.max(0, Math.floor(minutes || 0));
  let order = 1;

  while (remaining > 0) {
    const work = Math.min(25, remaining);
    blocks.push({
      id: genId("step-"),
      title: `Pomodoro ${order}`,
      duration: work,
      completed: false,
      order: blocks.length + 1,
    });
    remaining -= work;

    if (remaining <= 0) break;

    const br = 5;
    blocks.push({
      id: genId("step-"),
      title: `Descanso ${order}`,
      duration: br,
      completed: false,
      order: blocks.length + 1,
    });
    order++;
  }

  const goalCategory = (category as GoalCategory) ?? "Otro";
  const categoryMeta = CATEGORY_META[goalCategory] ?? CATEGORY_META["Otro"];

  const newGoal: Goal = {
    id: genId("goal-"),
    title: title ?? "Meta Inteligente",
    description,
    category: goalCategory,
    priority: (priority as GoalPriority) ?? "2",
    type: (type as GoalType) ?? "Hábito",
    color: overrides?.color ?? categoryMeta.color,
    icon: overrides?.icon ?? categoryMeta.icon,
    status: "active",
    scheduleMode: "dailySame",
    steps: blocks.map((b, i) => ({ ...b, order: i + 1 })),
    plan: undefined,
    totalFocusMinutes: blocks.reduce((a, b) => a + (b.duration || 0), 0),
    order: get().goalIds.length + 1,
    completedDates: [],
  };

  set((s) => ({
    goalsById: { ...s.goalsById, [newGoal.id]: newGoal },
    goalIds: [...s.goalIds, newGoal.id],
    _version: s._version + 1,
  }));

  emitEvent("goal.createdSmart", { goal: newGoal });
  return newGoal;
},
        updateGoal: (id, data) => {
          set((s) => {
            const existing = s.goalsById[id];
            if (!existing) return s;
            const merged = normalizeGoal({ ...existing, ...data });
            return {
              goalsById: { ...s.goalsById, [id]: merged },
              _version: s._version + 1,
            };
          });
        },

 deleteGoal: (id: string) => {
  set((s) => {
    const map = { ...s.goalsById };
    delete map[id];

    const cleanedDailyCompletionMap: Record<string, string[]> = {};
    Object.keys(s.dailyCompletionMap || {}).forEach((date) => {
      const filtered = (s.dailyCompletionMap[date] || []).filter(
        (goalId) => goalId !== id,
      );
      if (filtered.length > 0) cleanedDailyCompletionMap[date] = filtered;
    });

    const cleanedDailySchedulesByDate: Record<string, ScheduleBlock[]> = {};
    Object.keys(s.dailySchedulesByDate || {}).forEach((date) => {
      const filtered = (s.dailySchedulesByDate[date] || []).filter(
        (block) => block.goalId !== id,
      );
      if (filtered.length > 0) cleanedDailySchedulesByDate[date] = filtered;
    });

    const cleanedDailySchedule = (s.dailySchedule || []).filter(
      (block) => block.goalId !== id,
    );

    const cleanedFocusSession =
      s.focusSession?.goalId === id ? null : s.focusSession;

    return {
      goalsById: map,
      goalIds: s.goalIds.filter((g) => g !== id),
      dailyCompletionMap: cleanedDailyCompletionMap,
      dailySchedulesByDate: cleanedDailySchedulesByDate,
      dailySchedule: cleanedDailySchedule,
      focusSession: cleanedFocusSession,
      _version: s._version + 1,
    };
  });
},

        /* STEPS */
        addStep: (goalId, stepData) => {
          const step: Step = { ...stepData, id: genId("step-") };
          set((s) => {
            const g = s.goalsById[goalId];
            if (!g) return s;
            return {
              goalsById: {
                ...s.goalsById,
                [goalId]: {
                  ...g,
                  steps: [...g.steps, step],
                  totalFocusMinutes:
                    (g.totalFocusMinutes || 0) + (step.duration || 0),
                },
              },
              _version: s._version + 1,
            };
          });
          emitEvent("step.added", { goalId, step });
          return step;
        },

        updateStep: (goalId, stepId, data) => {
          set((s) => {
            const g = s.goalsById[goalId];
            if (!g) return s;
            const steps = g.steps.map((st) =>
              st.id === stepId ? { ...st, ...data } : st,
            );
            const updated = {
              ...g,
              steps,
              totalFocusMinutes: steps.reduce(
                (acc, x) => acc + (x.duration || 0),
                0,
              ),
            };
            return {
              goalsById: { ...s.goalsById, [goalId]: updated },
              _version: s._version + 1,
            };
          });
          emitEvent("step.updated", { goalId, stepId, data });
        },

        deleteStep: (goalId, stepId) => {
          set((s) => {
            const g = s.goalsById[goalId];
            if (!g) return s;
            const steps = g.steps.filter((st) => st.id !== stepId);
            return {
              goalsById: { ...s.goalsById, [goalId]: { ...g, steps } },
              _version: s._version + 1,
            };
          });
          emitEvent("step.deleted", { goalId, stepId });
        },
toggleStep: (goalId: string, stepId: string) => {
  const beforeAll = get().areAllStepsCompleted(goalId);
  const today = getTodayKey();

  set((s) => {
    const g = s.goalsById[goalId];
    if (!g) return s;

    const steps = g.steps.map((st) =>
      st.id === stepId ? { ...st, completed: !st.completed } : st,
    );

    const nowAll = steps.length > 0 && steps.every((st) => st.completed);

    const updatedGoal: Goal = {
      ...g,
      steps,
      completedDates: nowAll
        ? Array.from(new Set([...(g.completedDates || []), today]))
        : (g.completedDates || []).filter((d) => d !== today),
    };

    const map = { ...(s.dailyCompletionMap || {}) };

    if (nowAll) {
      const current = Array.isArray(map[today]) ? map[today] : [];
      map[today] = Array.from(new Set([...current, goalId]));
    } else {
      const current = Array.isArray(map[today]) ? map[today] : [];
      const next = current.filter((id) => id !== goalId);
      if (next.length > 0) map[today] = next;
      else delete map[today];
    }

    const newState = {
      ...s,
      goalsById: {
        ...s.goalsById,
        [goalId]: updatedGoal,
      },
      dailyCompletionMap: map,
      _version: s._version + 1,
    };

    return {
      ...newState,
      ...calculateStreaks(newState as GoalsState),
    };
  });

  emitEvent("step.toggled", { goalId, stepId });
  emitEvent("itinerary.changed");

  const afterAll = get().areAllStepsCompleted(goalId);
  if (!beforeAll && afterAll) emitEvent("goal.markedToday", { goalId });
  if (beforeAll && !afterAll) emitEvent("goal.unmarkedToday", { goalId });
},

        reorderSteps: (goalId, steps) =>
          set((s) => ({
            goalsById: {
              ...s.goalsById,
              [goalId]: { ...s.goalsById[goalId], steps },
            },
            _version: s._version + 1,
          })),

        rescheduleStep: (goalId, stepId, time) => {
          get().updateStep(goalId, stepId, { scheduledTime: time });
          emitEvent("itinerary.changed");
        },

        reorderItinerary: (fromIndex, toIndex) => {
          set((s) => {
            const items = [...s.dailySchedule];
            const [moved] = items.splice(fromIndex, 1);
            items.splice(toIndex, 0, moved);
            return { dailySchedule: items, _version: s._version + 1 };
          });
          emitEvent("itinerary.changed");
        },

        setStepsForGoal: (goalId, steps) => {
          const normalized = steps.map(normalizeStep);
          set((s) => {
            const g = s.goalsById[goalId];
            if (!g) return s;
            const updated = {
              ...g,
              steps: normalized,
              totalFocusMinutes: normalized.reduce(
                (acc, x) => acc + (x.duration || 0),
                0,
              ),
            };
            return {
              goalsById: { ...s.goalsById, [goalId]: updated },
              _version: s._version + 1,
            };
          });
        },

        /* SCHEDULING */
        setDailySchedule: (blocks) =>
          set((s) => ({ dailySchedule: blocks, _version: s._version + 1 })),

        setDailyScheduleForDate: (date, blocks) =>
          set((s) => ({
            dailySchedulesByDate: {
              ...(s.dailySchedulesByDate || {}),
              [date]: blocks,
            },
            _version: s._version + 1,
          })),

        getDailyScheduleForDate: (date) => {
          const key = date ?? getTodayKey();
          const s = get();
          return (
            (s.dailySchedulesByDate && s.dailySchedulesByDate[key]) ||
            s.dailySchedule ||
            []
          );
        },

        getItinerary: (range, date) => {
          const s = get();
          if (range === "day") return s.getDailyScheduleForDate(date);
          const start = date ? parseYYYYMMDD(date) : new Date();
          const out: ScheduleBlock[] = [];
          for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            const blocks = s.dailySchedulesByDate?.[key] ?? [];
            blocks.forEach((b) => out.push({ ...b }));
          }
          return out;
        },

        generateScheduleProposal: (date) => {
          try {
            const s = get();
            const available = s.settings.availableTimeBlocks ?? [];
            type Slot = {
              startMin: number;
              endMin: number;
              cursor: number;
              remaining: number;
            };
            const slots: Slot[] = available
              .map((b) => {
                const startMin = timeStrToMinutes(b.start);
                const endMin = timeStrToMinutes(b.end);
                if (endMin <= startMin) return null;
                return {
                  startMin,
                  endMin,
                  cursor: startMin,
                  remaining: endMin - startMin,
                };
              })
              .filter(Boolean) as Slot[];

            const goals = get().getGoalsList();
            type PendingStep = {
              goalId: string;
              goalTitle: string;
              goalPriority: GoalPriority;
              goalOrder: number;
              stepId: string;
              stepOrder: number;
              duration: number;
              deadline?: string | undefined;
            };
            const pendingSteps: PendingStep[] = [];
            goals.forEach((g) => {
              if (g.status !== "active") return;
              g.steps.forEach((st) => {
                if (!st.completed) {
                  pendingSteps.push({
                    goalId: g.id,
                    goalTitle: g.title,
                    goalPriority: g.priority,
                    goalOrder: g.order,
                    stepId: st.id,
                    stepOrder: st.order,
                    duration: st.duration || 0,
                    deadline: g.deadline,
                  });
                }
              });
            });

            const totalAvailable = slots.reduce((a, b) => a + b.remaining, 0);
            const totalRequired = pendingSteps.reduce(
              (a, b) => a + b.duration,
              0,
            );
            const warnings: string[] = [];
            if (totalRequired > totalAvailable) {
              warnings.push(
                `Tareas requieren ${totalRequired} min pero solo hay ${totalAvailable} min disponibles.`,
              );
            }

            pendingSteps.sort((a: PendingStep, b: PendingStep) => {
              const pa = Number(a.goalPriority);
              const pb = Number(b.goalPriority);
              if (pa !== pb) return pa - pb;
              if (a.deadline && b.deadline)
                return (
                  new Date(a.deadline).getTime() -
                  new Date(b.deadline).getTime()
                );
              if (a.deadline) return -1;
              if (b.deadline) return 1;
              if (a.goalOrder !== b.goalOrder) return a.goalOrder - b.goalOrder;
              return a.stepOrder - b.stepOrder;
            });

            const proposal: ScheduleBlock[] = [];
            for (const step of pendingSteps) {
              let placed = false;
              for (let i = 0; i < slots.length; i++) {
                const slot = slots[i];
                if (slot.remaining >= step.duration) {
                  const startMin = slot.cursor;
                  const endMin = slot.cursor + step.duration;
                  // protección para que no quiebre el cálculo
                  if (endMin <= slot.endMin) {
                    proposal.push({
                      id: genId("sb-"),
                      goalId: step.goalId,
                      goalTitle: step.goalTitle,
                      start: minutesToTimeStr(startMin),
                      end: minutesToTimeStr(endMin),
                      minutes: step.duration,
                      stepId: step.stepId,
                    });
                    slot.cursor = endMin;
                    slot.remaining = Math.max(0, slot.endMin - slot.cursor);
                    placed = true;
                    break;
                  }
                }
              }
              if (!placed) {
                warnings.push(
                  `No se pudo ubicar paso ${step.goalTitle} (${step.duration}m).`,
                );
              }
            }
            return { proposal, warnings };
          } catch (e) {
            console.warn("generateScheduleProposal error", e);
            return { proposal: [], warnings: ["Error generando propuesta"] };
          }
        },

        validateOverload: (date) => {
          try {
            const s = get();
            const available = s.settings.availableTimeBlocks ?? [];
            const slotsMinutes = available.reduce((acc, b) => {
              const st = timeStrToMinutes(b.start);
              const ed = timeStrToMinutes(b.end);
              return acc + Math.max(0, ed - st);
            }, 0);
            const goals = s.getGoalsList();
            const pendingMinutes = goals.reduce((acc, g) => {
              if (g.status !== "active") return acc;
              const gPending = g.steps
                .filter((st) => !st.completed)
                .reduce((a, b) => a + (b.duration || 0), 0);
              return acc + gPending;
            }, 0);
            const ok = pendingMinutes <= slotsMinutes;
            const warnings: string[] = [];
            let deficit: number | undefined = undefined;
            if (!ok) {
              deficit = pendingMinutes - slotsMinutes;
              warnings.push(
                `Falta ${deficit} minutos. Se priorizarán metas con prioridad más alta.`,
              );
            }
            return { ok, warnings, deficitMinutes: deficit };
          } catch (e) {
            console.warn("validateOverload error", e);
            return { ok: true, warnings: [] };
          }
        },

        updateScheduleBlock: (blockId, newStart, newEnd) =>
          set((s) => ({
            dailySchedule: s.dailySchedule.map((b) =>
              b.id === blockId
                ? {
                    ...b,
                    start: newStart,
                    end: newEnd,
                    minutes: Math.abs(
                      timeStrToMinutes(newEnd) - timeStrToMinutes(newStart),
                    ),
                  }
                : b,
            ),
            _version: s._version + 1,
          })),

        removeScheduleBlock: (blockId) =>
          set((s) => ({
            dailySchedule: s.dailySchedule.filter((b) => b.id !== blockId),
            _version: s._version + 1,
          })),

        /* FOCUS ENGINE */
/* FOCUS ENGINE */
startFocus: (goalId, stepId, opts) => {
  const s = get();
  const g = s.goalsById[goalId];
  if (!g || g.status !== "active") return;

  let startIndex = 0;

  if (stepId) {
    startIndex = g.steps.findIndex((x) => x.id === stepId);
  } else {
    startIndex = g.steps.findIndex((x) => !x.completed);
  }

  if (startIndex === -1) return;

  const step = g.steps[startIndex];
  const totalSets = Math.max(1, step.sets ?? 1);
  const restSeconds = Math.max(0, step.rest ?? 60);
  const remainingSeconds = Math.max(1, opts?.seconds ?? step.duration * 60);
  const now = Date.now();

  const session: FocusSession = {
    running: true,
    goalId,
    stepId: step.id,
    stepIndex: startIndex,
    phase: "work",
    remainingSeconds,
    currentSet: 1,
    totalSets,
    restSeconds,
    startedAt: now,
    lastTickAt: now,
    autoAdvance: opts?.autoAdvance ?? true,
    autoMark: opts?.autoMark ?? true,
  };

  set((st) => ({
    focusSession: session,
    _version: st._version + 1,
  }));

  emitEvent("focus.started", { goalId, stepId: step.id });
},

pauseFocus: () => {
  set((s) =>
    s.focusSession
      ? {
          focusSession: { ...s.focusSession, running: false },
          _version: s._version + 1,
        }
      : {},
  );
  emitEvent("focus.paused");
},

resumeFocus: () => {
  set((s) =>
    s.focusSession
      ? {
          focusSession: {
            ...s.focusSession,
            running: true,
            lastTickAt: Date.now(),
          },
          _version: s._version + 1,
        }
      : {},
  );
  emitEvent("focus.resumed");
},

skipSetOrStep: () => {
  const s = get();
  const fs = s.focusSession;
  if (!fs) return;

  set((st) => ({
    focusSession: st.focusSession
      ? { ...st.focusSession, remainingSeconds: 0 }
      : null,
    _version: st._version + 1,
  }));

  get().tick(Date.now());
},

tick: (now = Date.now()) => {
  const s = get();
  const fs = s.focusSession;
  if (!fs || !fs.running) return;

  let delta = Math.max(0, Math.floor((now - (fs.lastTickAt || now)) / 1000));
  if (delta <= 0) return;

  let localFS: FocusSession | null = { ...fs };

  const safeGetCurrentStep = () => {
    if (!localFS) return null;
    const gg = get().goalsById[localFS.goalId];
    if (!gg) return null;
    return gg.steps[localFS.stepIndex] ?? null;
  };

  while (delta > 0 && localFS) {
    if (!localFS.running) break;

    if (delta <= localFS.remainingSeconds) {
      localFS.remainingSeconds = localFS.remainingSeconds - delta;
      delta = 0;
      localFS.lastTickAt = now;
      break;
    }

    delta = delta - localFS.remainingSeconds;
    localFS.remainingSeconds = 0;

    const currentStep = safeGetCurrentStep();
    if (!currentStep) {
      localFS = null;
      break;
    }

    if (localFS.phase === "work") {
      if (localFS.currentSet < localFS.totalSets) {
        if ((localFS.restSeconds ?? 0) > 0) {
          localFS.phase = "rest";
          localFS.remainingSeconds = localFS.restSeconds;
        } else {
          localFS.currentSet = localFS.currentSet + 1;
          localFS.phase = "work";
          localFS.remainingSeconds = Math.max(1, (currentStep.duration || 1) * 60);
        }
      } else {
        get().updateStep(localFS.goalId, localFS.stepId, {
          completed: true,
        });

        emitEvent("focus.step.completed", {
          goalId: localFS.goalId,
          stepId: localFS.stepId,
        });

        const goal = get().goalsById[localFS.goalId];
        if (!goal) {
          localFS = null;
          break;
        }

        const nextIdx = goal.steps.findIndex(
          (st, i) => i > localFS!.stepIndex && !st.completed,
        );

        if (nextIdx !== -1 && localFS.autoAdvance) {
          const nextStep = goal.steps[nextIdx];
          localFS.stepIndex = nextIdx;
          localFS.stepId = nextStep.id;
          localFS.phase = "work";
          localFS.currentSet = 1;
          localFS.totalSets = Math.max(1, nextStep.sets ?? 1);
          localFS.restSeconds = Math.max(0, nextStep.rest ?? 60);
          localFS.remainingSeconds = Math.max(1, (nextStep.duration || 1) * 60);
        } else {
          const allDone = goal.steps.every((st) => st.completed);
          if (allDone && localFS.autoMark) {
            get().markGoalCompletedToday(localFS.goalId);
          }

          if (allDone) {
            emitEvent("focus.goal.completed", {
              goalId: localFS.goalId,
            });
          }

          localFS = null;
          break;
        }
      }
    } else if (localFS.phase === "rest") {
      localFS.currentSet = localFS.currentSet + 1;
      localFS.phase = "work";

      const cs = safeGetCurrentStep();
      localFS.remainingSeconds = Math.max(1, (cs?.duration ?? 1) * 60);
    } else {
      localFS = null;
      break;
    }
  }

  if (!localFS) {
    set((st) => ({
      focusSession: null,
      _version: st._version + 1,
    }));
    emitEvent("focus.finished");
    return;
  }

  localFS.lastTickAt = now;

  set((st) => ({
    focusSession: localFS,
    _version: st._version + 1,
  }));
},

finishFocus: () => {
  const s = get();
  if (!s.focusSession) return;

  set(() => ({
    focusSession: null,
  }));

  emitEvent("focus.finished");
},
        /* EVENTS y utilidades */
        on: (e, cb) => {
          if (!eventsBus[e]) eventsBus[e] = [];
          eventsBus[e].push(cb);
        },

        off: (e, cb) => {
          eventsBus[e] = (eventsBus[e] || []).filter((c) => c !== cb);
        },

        emit: (e, payload) => emitEvent(e, payload),

        setAccentColor: (c) =>
          set((s) => ({
            settings: { ...s.settings, accentColor: c },
            _version: s._version + 1,
          })),

        setAvailableTimeBlocks: (blocks) =>
          set((s) => ({
            settings: { ...s.settings, availableTimeBlocks: blocks },
            _version: s._version + 1,
          })),

        setTheme: (mode) =>
          set((s) => ({
            settings: { ...s.settings, theme: mode },
            _version: s._version + 1,
          })),
        setMinimalMode: (minimalMode) =>
          set((s) => ({
            settings: { ...s.settings, minimalMode },
            _version: s._version + 1,
          })),

        completeOnboarding: () =>
          set((s) => ({
            hasFinishedOnboarding: true,
            _version: s._version + 1,
          })),

        isTodayMarked: () => {
          const today = getTodayKey();
          const arr = get().dailyCompletionMap[today] ?? [];
          return arr.length > 0;
        },

        markTodayComplete: () => get().markTodayCompleteIfEligible(),
resetAll: () =>
  set(() => ({
    goalsById: {},
    goalIds: [],
    settings: {
      accentColor: "#f59e0b",
      availableTimeBlocks: [
        { start: "08:00", end: "12:00" },
        { start: "17:00", end: "20:00" },
      ],
      dayStartTime: "08:00",
      dayEndTime: "22:00",
      theme: "system",
      minimalMode: false,
    },
    externalEvents: [],
    dailySchedule: [],
    dailySchedulesByDate: {},
    dailyCompletionMap: {},
    hasFinishedOnboarding: false,
    focusSession: null,
    globalStreak: 0,
    bestStreak: 0,
    lastRolloverDate: undefined,
    templates: DEFAULT_TEMPLATES,
    _version: 0,
  })),
backupToJSON: () =>
  JSON.stringify({
    storeVersion: get().storeVersion,
    goalsById: get().goalsById,
    goalIds: get().goalIds,
    settings: get().settings,
    externalEvents: get().externalEvents,
    dailyCompletionMap: get().dailyCompletionMap,
    dailySchedule: get().dailySchedule,
    dailySchedulesByDate: get().dailySchedulesByDate,
    hasFinishedOnboarding: get().hasFinishedOnboarding,
    focusSession: get().focusSession,
    globalStreak: get().globalStreak,
    bestStreak: get().bestStreak,
    lastRolloverDate: get().lastRolloverDate,
    templates: get().templates,
  }),

restoreFromJSON: (json) => {
  try {
    const parsed = JSON.parse(json);
    if (!parsed) return;

    const safeGoalsById: Record<string, Goal> = {};
    if (parsed.goalsById && typeof parsed.goalsById === "object") {
      Object.keys(parsed.goalsById).forEach((k) => {
        safeGoalsById[k] = normalizeGoal(parsed.goalsById[k]);
      });
    }

    const safeDailySchedulesByDate: Record<string, ScheduleBlock[]> = {};
    if (
      parsed.dailySchedulesByDate &&
      typeof parsed.dailySchedulesByDate === "object"
    ) {
      Object.keys(parsed.dailySchedulesByDate).forEach((date) => {
        safeDailySchedulesByDate[date] = Array.isArray(
          parsed.dailySchedulesByDate[date],
        )
          ? parsed.dailySchedulesByDate[date]
          : [];
      });
    }

    const safeDailySchedule: ScheduleBlock[] = Array.isArray(parsed.dailySchedule)
      ? parsed.dailySchedule
      : [];

    const safeTemplates: GoalTemplate[] = Array.isArray(parsed.templates) &&
      parsed.templates.length > 0
      ? parsed.templates
      : DEFAULT_TEMPLATES;

    const safeFocusSession: FocusSession | null =
      parsed.focusSession && typeof parsed.focusSession === "object"
        ? parsed.focusSession
        : null;

    set(() => ({
      goalsById: safeGoalsById,
      goalIds: Array.isArray(parsed.goalIds)
        ? parsed.goalIds
        : Object.keys(safeGoalsById),
      settings: parsed.settings ?? get().settings,
      externalEvents: Array.isArray(parsed.externalEvents)
        ? parsed.externalEvents
        : get().externalEvents,
      dailyCompletionMap: parsed.dailyCompletionMap ?? {},
      dailySchedule: safeDailySchedule,
      dailySchedulesByDate: safeDailySchedulesByDate,
      hasFinishedOnboarding:
        typeof parsed.hasFinishedOnboarding === "boolean"
          ? parsed.hasFinishedOnboarding
          : get().hasFinishedOnboarding,
      focusSession: safeFocusSession,
      globalStreak:
        typeof parsed.globalStreak === "number" ? parsed.globalStreak : 0,
      bestStreak: typeof parsed.bestStreak === "number" ? parsed.bestStreak : 0,
      lastRolloverDate:
        typeof parsed.lastRolloverDate === "string"
          ? parsed.lastRolloverDate
          : undefined,
      templates: safeTemplates,
      _version: Date.now(),
    }));
  } catch (e) {
    console.warn("restoreFromJSON error", e);
  }
},

       markGoalCompletedToday: (goalId: string) => {
  const today = getTodayKey();

  set((s) => {
    const g = s.goalsById[goalId];
    if (!g) return s;

    const map = { ...(s.dailyCompletionMap || {}) };
    const current = Array.isArray(map[today]) ? map[today] : [];
    map[today] = Array.from(new Set([...current, goalId]));

    const newCompletedDates = Array.from(
      new Set([...(g.completedDates || []), today]),
    );

    const newGoalsById = {
      ...s.goalsById,
      [goalId]: {
        ...g,
        completedDates: newCompletedDates,
      },
    };

    const newState = {
      ...s,
      dailyCompletionMap: map,
      goalsById: newGoalsById,
      _version: s._version + 1,
    };

    return {
      ...newState,
      ...calculateStreaks(newState as GoalsState),
    };
  });

  emitEvent("goal.markedToday", { goalId });
},

unmarkGoalCompletedToday: (goalId: string) => {
  const today = getTodayKey();

  set((s) => {
    const g = s.goalsById[goalId];
    if (!g) return s;

    const map = { ...(s.dailyCompletionMap || {}) };
    const nextToday = (map[today] || []).filter((id) => id !== goalId);

    if (nextToday.length > 0) map[today] = nextToday;
    else delete map[today];

    const newCompletedDates = (g.completedDates || []).filter(
      (d) => d !== today,
    );

    const newGoalsById = {
      ...s.goalsById,
      [goalId]: {
        ...g,
        completedDates: newCompletedDates,
      },
    };

    const newState = {
      ...s,
      dailyCompletionMap: map,
      goalsById: newGoalsById,
      _version: s._version + 1,
    };

    return {
      ...newState,
      ...calculateStreaks(newState as GoalsState),
    };
  });

  emitEvent("goal.unmarkedToday", { goalId });
},

markTodayCompleteIfEligible: () => {
  const activeGoals = get().getActiveGoalsMemo();

  if (activeGoals.length === 0) return false;

  const allEligible = activeGoals.every((g) => get().areAllStepsCompleted(g.id));

  if (!allEligible) return false;

  activeGoals.forEach((g) => get().markGoalCompletedToday(g.id));
  return true;
},

recalculateStreaks: () => {
  set((s) => ({
    ...s,
    ...calculateStreaks(s),
    _version: s._version + 1,
  }));
},
        /* ============================
           ROLLOVER DIARIO
           - Resetea pasos completados al comenzar un nuevo día
           - Recalcula rachas
           - Archiva metas cuya deadline ya pasó
           ============================ */
     performDailyRollover: (today?: string) => {
  const todayKey = today ?? getTodayKey();
  const s = get();

  if (s.lastRolloverDate === todayKey) {
    return { rolled: false, archivedGoals: [] };
  }

  const archivedGoals: string[] = [];
  const updatedGoalsById: Record<string, Goal> = { ...s.goalsById };

  Object.keys(updatedGoalsById).forEach((gid) => {
    const g = updatedGoalsById[gid];
    if (!g) return;

    // Archivar metas vencidas
    if (g.deadline) {
      const dl = parseYYYYMMDD(g.deadline);
      const tdate = parseYYYYMMDD(todayKey);
      if (dl.getTime() < tdate.getTime()) {
        updatedGoalsById[gid] = { ...g, status: "archived" };
        archivedGoals.push(gid);
        return;
      }
    }

    // Reiniciar pasos al empezar un nuevo día
    if (g.status === "active" && Array.isArray(g.steps) && g.steps.length > 0) {
      updatedGoalsById[gid] = {
        ...g,
        steps: g.steps.map((st) => ({
          ...st,
          completed: false,
        })),
      };
    }
  });

  const newState: Partial<GoalsState> = {
    goalsById: updatedGoalsById,
    lastRolloverDate: todayKey,
    focusSession: null,
    _version: s._version + 1,
  };

  const streaks = calculateStreaks({
    ...(s as any),
    ...newState,
  } as GoalsState);

  set((prev) => ({
    ...prev,
    ...newState,
    ...streaks,
  }));

  emitEvent("daily.rollover", { date: todayKey, archivedGoals });
  emitEvent("itinerary.changed");

  return { rolled: true, archivedGoals };
},

rolloverIfNeeded: (today?: string) => get().performDailyRollover(today),
      };
    },
    {
      name: "ascend-store-v6",
      storage: createJSONStorage(() => AsyncStorage),
      version: 7,
      migrate: (persistedState) => {
        const state = (persistedState as any)?.state ?? persistedState;
        if (!state) return persistedState;
        const migrated: any = { ...state };
        if (
          Array.isArray(state.goals) &&
          (!state.goalsById || Object.keys(state.goalsById).length === 0)
        ) {
          const byId: Record<string, Goal> = {};
          const ids: string[] = [];
          (state.goals as any[]).forEach((gRaw) => {
            const g = normalizeGoal(gRaw);
            byId[g.id] = g;
            ids.push(g.id);
          });
          migrated.goalsById = byId;
          migrated.goalIds = ids;
        }
        if (migrated.goalsById) {
          Object.keys(migrated.goalsById).forEach((k) => {
            const g = migrated.goalsById[k];
            g.steps = Array.isArray(g.steps) ? g.steps.map(normalizeStep) : [];
            g.completedDates = Array.isArray(g.completedDates)
              ? g.completedDates
              : [];
          });
        }
        if (typeof migrated.globalStreak === "undefined")
          migrated.globalStreak = 0;
        if (typeof migrated.bestStreak === "undefined") migrated.bestStreak = 0;
        // asegurar settings si vienen incompletos en migraciones antiguas
        migrated.settings = migrated.settings ?? {
          accentColor: "#f59e0b",
          availableTimeBlocks: [
            { start: "08:00", end: "12:00" },
            { start: "17:00", end: "20:00" },
          ],
          dayStartTime: "08:00",
          dayEndTime: "22:00",
          theme: "system",
          minimalMode: false,
        };
        if (!migrated.settings.theme) migrated.settings.theme = "system";
        // asegurar lastRolloverDate si no existe
        if (typeof migrated.lastRolloverDate === "undefined")
          migrated.lastRolloverDate = undefined;
        if (!Array.isArray(migrated.templates) || migrated.templates.length === 0) {
    migrated.templates = DEFAULT_TEMPLATES;
  }

  migrated.storeVersion = 7;
  return migrated;
},
    },
  ),
);

export default useGoalsStore;

/* ============================
   UTIL: buildStats
   ============================ */
function buildStats(goals: Goal[], globalStreak: number, bestStreak: number) {
  const totalGoals = goals.length;
  const activeGoals = goals.filter(
    (g) => g.status === "active" && g.steps.length > 0,
  ).length;
  const totalSteps = goals.reduce((acc, g) => acc + g.steps.length, 0);
  const completedSteps = goals.reduce(
    (acc, g) => acc + g.steps.filter((s) => s.completed).length,
    0,
  );
  const totalMinutes = goals.reduce(
    (acc, g) => acc + g.steps.reduce((b, s) => b + (s.duration || 0), 0),
    0,
  );
  const totalFocusMinutes = goals.reduce(
    (acc, g) => acc + (g.totalFocusMinutes || 0),
    0,
  );
  const consistency =
    totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);
  return {
    totalGoals,
    activeGoals,
    completedSteps,
    totalSteps,
    totalMinutes,
    totalFocusMinutes,
    consistency,
    globalStreak,
    bestStreak,
  };
}
