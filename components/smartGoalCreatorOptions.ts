import type { GoalCategory, WorkoutEnvironment } from "../store/useGoalsStore";

/**
 * Opciones visibles del creador de metas.
 * Se separan del componente para que la UI no cargue reglas estáticas.
 */
export const CATEGORY_SUBCATEGORIES: Record<GoalCategory, string[]> = {
  Fitness: [
    "General",
    "Casa",
    "Gimnasio",
    "Calistenia",
    "Atletismo",
    "Fuerza",
    "Hipertrofia",
    "Resistencia",
    "Movilidad",
  ],
  Estudio: ["General", "Pomodoro", "Repaso", "Exámenes", "Lectura"],
  Carrera: ["General", "Portafolio", "CV", "Entrevistas", "Postulaciones"],
  Salud: ["General", "Sueño", "Nutrición", "Movimiento", "Autocuidado"],
  Finanzas: ["General", "Presupuesto", "Ahorro", "Inversión", "Deudas"],
  Otro: ["General", "Productividad", "Hábito", "Aprendizaje", "Orden"],
};

export const GOAL_CATEGORIES: GoalCategory[] = [
  "Fitness",
  "Estudio",
  "Carrera",
  "Salud",
  "Finanzas",
  "Otro",
];

export const FITNESS_STYLES = [
  "General",
  "Arnold Split",
  "Heavy Duty",
  "Full Body",
  "Push Pull Legs",
  "Torso Pierna",
  "Upper Lower",
  "Calistenia",
  "Atletismo",
  "Movilidad",
  "Resistencia",
];

export const WORKOUT_ENVIRONMENTS: WorkoutEnvironment[] = [
  "Casa",
  "Gimnasio",
  "Mixto",
];

export const COLOR_PALETTE = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#64748b",
  "#111827",
  "#6b7280",
];
