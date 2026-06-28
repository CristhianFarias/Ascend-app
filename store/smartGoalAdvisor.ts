import { calculateAutoWeekdays, sanitizeFrequency } from "./goalScheduleUtils";
import type {
  GoalCategory,
  GoalPriority,
  GoalTemplate,
  WorkoutEnvironment,
} from "./goalTypes";

export type AdvisorIntent =
  | "habit"
  | "deadline"
  | "fitness"
  | "study"
  | "focus";

export type AdvisorAvailability = "light" | "normal" | "intense";
export type AdvisorLevel = "beginner" | "intermediate" | "advanced";

export type SmartGoalAdvisorInput = {
  templates: GoalTemplate[];
  category: GoalCategory;
  subCategory: string;
  workoutEnvironment: WorkoutEnvironment;
  workoutStyle: string;
  deadline?: string;
  intent: AdvisorIntent;
  availability: AdvisorAvailability;
  level: AdvisorLevel;
};

export type SmartGoalRecommendation = {
  template?: GoalTemplate;
  title: string;
  description: string;
  priority: GoalPriority;
  frequencyPerWeek: number;
  plannedWeekdays: number[];
  notes: string[];
};

const availabilityCap: Record<AdvisorAvailability, number> = {
  light: 2,
  normal: 4,
  intense: 6,
};

const levelBoost: Record<AdvisorLevel, number> = {
  beginner: -1,
  intermediate: 0,
  advanced: 1,
};

const daysUntilDeadline = (deadline?: string) => {
  if (!deadline) return undefined;
  const today = new Date();
  const [year, month, day] = deadline.split("-").map((x) => Number(x) || 0);
  const target = new Date(year, month - 1, day);
  const diff = target.getTime() - today.setHours(0, 0, 0, 0);
  return Math.ceil(diff / 86400000);
};

const scoreTemplate = (template: GoalTemplate, input: SmartGoalAdvisorInput) => {
  let score = 0;
  if (template.category === input.category) score += 10;
  if ((template.subCategory ?? "General") === input.subCategory) score += 4;

  if (input.category === "Fitness") {
    if ((template.workoutEnvironment ?? "Mixto") === input.workoutEnvironment) {
      score += 3;
    }
    if ((template.workoutStyle ?? "General") === input.workoutStyle) score += 3;
  }

  const text = `${template.name} ${template.description ?? ""}`.toLowerCase();
  if (input.intent === "study" && /estudio|repaso|lectura|examen/.test(text)) {
    score += 5;
  }
  if (input.intent === "fitness" && template.category === "Fitness") score += 5;
  if (input.intent === "deadline" && template.defaultScheduleMode === "weeklyPlan") {
    score += 2;
  }
  if (input.intent === "focus" && /pomodoro|focus|profundo/.test(text)) score += 4;

  return score;
};

/**
 * Recomienda una meta sin IA externa.
 * Usa las plantillas como fuente de conocimiento y aplica reglas simples.
 */
export const recommendSmartGoal = (
  input: SmartGoalAdvisorInput,
): SmartGoalRecommendation => {
  const ranked = [...input.templates]
    .filter((template) => template.category === input.category)
    .sort((a, b) => scoreTemplate(b, input) - scoreTemplate(a, input));

  const template = ranked[0];
  const deadlineDays = daysUntilDeadline(input.deadline);
  const templateFrequency = template?.frequencyPerWeek ?? 3;
  const cap = availabilityCap[input.availability];
  const adjusted = sanitizeFrequency(templateFrequency + levelBoost[input.level]);
  let frequencyPerWeek = Math.min(cap, adjusted);

  if (typeof deadlineDays === "number" && deadlineDays <= 7) {
    frequencyPerWeek = Math.max(frequencyPerWeek, Math.min(6, cap + 1));
  }

  if (input.intent === "habit") frequencyPerWeek = Math.max(3, frequencyPerWeek);
  if (input.intent === "deadline") frequencyPerWeek = Math.max(4, frequencyPerWeek);

  frequencyPerWeek = sanitizeFrequency(frequencyPerWeek);

  const title = template?.name
    ? template.name
    : input.category === "Fitness"
      ? `Rutina ${input.workoutStyle}`
      : `Meta de ${input.category}`;

  const notes = [
    `Frecuencia sugerida: ${frequencyPerWeek}x por semana.`,
    "Descanso automático activado para repartir sesiones.",
  ];

  if (template) notes.push(`Plantilla recomendada: ${template.name}.`);
  if (input.deadline) notes.push("Se priorizará hasta la fecha límite.");

  return {
    template,
    title,
    description:
      template?.description ??
      "Meta creada con una estructura base para empezar hoy.",
    priority: input.intent === "deadline" ? "1" : "2",
    frequencyPerWeek,
    plannedWeekdays: calculateAutoWeekdays(frequencyPerWeek),
    notes,
  };
};
