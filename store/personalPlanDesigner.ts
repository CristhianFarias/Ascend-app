import { calculateAutoWeekdays, sanitizeFrequency } from "./goalScheduleUtils";
import type {
  GoalCategory,
  GoalObjective,
  GoalPriority,
  GoalTemplate,
  TemplateExercise,
  TemplateSession,
  WorkoutEnvironment,
} from "./goalTypes";

export type PlanDesignerMode = "design" | "assistant";
export type PlanAvailability = "light" | "normal" | "intense";
export type PlanLevel = "beginner" | "intermediate" | "advanced";

export type PersonalPlanInput = {
  templates: GoalTemplate[];
  category: GoalCategory;
  subCategory?: string;
  title?: string;
  deadline?: string;
  primaryObjective: GoalObjective;
  secondaryObjectives: GoalObjective[];
  availability: PlanAvailability;
  level: PlanLevel;
  workoutEnvironment: WorkoutEnvironment;
  workoutStyle: string;
  sessionMinutes?: number;
};

export type PersonalPlanProposal = {
  title: string;
  description: string;
  priority: GoalPriority;
  template?: GoalTemplate;
  plan: TemplateSession[];
  frequencyPerWeek: number;
  plannedWeekdays: number[];
  primaryObjective: GoalObjective;
  secondaryObjectives: GoalObjective[];
  notes: string[];
};

export const OBJECTIVE_LABELS: Record<GoalObjective, string> = {
  strength: "Fuerza",
  hypertrophy: "Hipertrofia",
  fatLoss: "Pérdida de grasa",
  endurance: "Resistencia",
  mobility: "Movilidad",
  habit: "Crear hábito",
  exam: "Preparar examen",
  project: "Proyecto",
  career: "Carrera",
  wellness: "Bienestar",
  finance: "Finanzas",
  custom: "Personalizado",
};

export const CATEGORY_OBJECTIVES: Record<GoalCategory, GoalObjective[]> = {
  Fitness: ["strength", "hypertrophy", "fatLoss", "endurance", "mobility", "habit"],
  Estudio: ["exam", "habit", "project"],
  Carrera: ["career", "project", "habit"],
  Salud: ["wellness", "habit", "mobility"],
  Finanzas: ["finance", "project", "habit"],
  Otro: ["custom", "project", "habit"],
};

const availabilityFrequency: Record<PlanAvailability, number> = {
  light: 3,
  normal: 4,
  intense: 5,
};

const objectiveKeywords: Record<GoalObjective, string[]> = {
  strength: ["fuerza", "heavy", "full body", "torso"],
  hypertrophy: ["hipertrofia", "push pull", "torso", "volumen"],
  fatLoss: ["cardio", "resistencia", "movimiento"],
  endurance: ["cardio", "resistencia", "atletismo"],
  mobility: ["movilidad", "core", "autocuidado"],
  habit: ["hábito", "rutina", "diario"],
  exam: ["examen", "repaso", "pomodoro"],
  project: ["proyecto", "portafolio", "presupuesto"],
  career: ["cv", "portafolio", "entrevista", "postulaciones"],
  wellness: ["sueño", "autocuidado", "hidratación", "caminata"],
  finance: ["presupuesto", "ahorro", "deudas", "inversión"],
  custom: ["personal", "aprendizaje", "productividad"],
};

const clonePlan = (plan: TemplateSession[] = []): TemplateSession[] =>
  plan.map((session, sessionIndex) => ({
    ...session,
    order: session.order ?? sessionIndex + 1,
    exercises: session.exercises.map((exercise, exerciseIndex) => ({
      ...exercise,
      order: exercise.order ?? exerciseIndex + 1,
    })),
  }));

const getTemplatePlan = (
  template: GoalTemplate | undefined,
  workoutEnvironment: WorkoutEnvironment,
) => {
  if (!template) return [];
  return clonePlan(
    template.environmentPlans?.[workoutEnvironment] ??
      template.environmentPlans?.Mixto ??
      template.defaultPlan ??
      [],
  );
};

const scoreTemplate = (
  template: GoalTemplate,
  input: PersonalPlanInput,
) => {
  let score = template.category === input.category ? 12 : -20;
  const wantedSubCategory = input.subCategory ?? "General";
  const templateSubCategory = template.subCategory ?? "General";
  const searchable = [
    template.name,
    template.description,
    template.subCategory,
    template.workoutStyle,
    ...(template.flexibilityTags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (template.primaryObjectives?.includes(input.primaryObjective)) score += 10;
  if (template.secondaryObjectives?.some((item) => input.secondaryObjectives.includes(item))) {
    score += 4;
  }

  // La subcategoría elegida por el usuario debe pesar bastante.
  // Evita que una plantilla popular gane cuando se pidió movilidad, calistenia, examen, etc.
  if (wantedSubCategory !== "General") {
    if (templateSubCategory === wantedSubCategory) score += 14;
    else score -= 10;
  }

  objectiveKeywords[input.primaryObjective].forEach((word) => {
    if (searchable.includes(word)) score += 3;
  });

  input.secondaryObjectives.forEach((objective) => {
    objectiveKeywords[objective].forEach((word) => {
      if (searchable.includes(word)) score += 1;
    });
  });

  if (input.workoutStyle !== "General") {
    if (template.workoutStyle === input.workoutStyle) score += 10;
    else if (template.category === "Fitness") score -= 6;
  }

  if (
    input.workoutEnvironment === "Mixto" ||
    template.workoutEnvironment === input.workoutEnvironment ||
    template.environmentPlans?.[input.workoutEnvironment]
  ) {
    score += 2;
  }

  return score;
};

const pickTemplate = (input: PersonalPlanInput) =>
  [...input.templates]
    .filter((template) => template.category === input.category)
    .sort((a, b) => scoreTemplate(b, input) - scoreTemplate(a, input))[0];

const getFrequency = (input: PersonalPlanInput, template?: GoalTemplate) => {
  const base = template?.frequencyPerWeek ?? availabilityFrequency[input.availability];
  const objectiveBoost =
    input.primaryObjective === "fatLoss" ||
    input.primaryObjective === "endurance" ||
    input.primaryObjective === "habit"
      ? 1
      : 0;
  const levelBoost = input.level === "advanced" ? 1 : input.level === "beginner" ? -1 : 0;
  return sanitizeFrequency(base + objectiveBoost + levelBoost);
};

const addFitnessModifiers = (
  plan: TemplateSession[],
  input: PersonalPlanInput,
): TemplateSession[] => {
  if (input.category !== "Fitness") return plan;

  const result = clonePlan(plan);
  const secondary = new Set(input.secondaryObjectives);
  const wantsConditioning =
    input.primaryObjective === "fatLoss" || secondary.has("fatLoss") || secondary.has("endurance");
  const wantsMobility = input.primaryObjective === "mobility" || secondary.has("mobility");
  const wantsHypertrophy = input.primaryObjective === "hypertrophy" || secondary.has("hypertrophy");

  if (wantsHypertrophy) {
    result.forEach((session) => {
      session.exercises = session.exercises.map((exercise) => ({
        ...exercise,
        reps: exercise.reps ?? 10,
        sets: exercise.sets ?? 3,
        metadata: { ...(exercise.metadata ?? {}), emphasis: "volumen controlado" },
      }));
    });
  }

  if (wantsConditioning) {
    result.push({
      name: "Condicionamiento",
      order: result.length + 1,
      exercises: [
        { name: "Cardio moderado", duration: 15, order: 1 },
        { name: "Intervalos suaves", duration: 10, sets: 5, rest: 45, order: 2 },
      ],
    });
  }

  if (wantsMobility) {
    result.push({
      name: "Movilidad y recuperación",
      order: result.length + 1,
      exercises: [
        { name: "Movilidad de cadera y hombros", duration: 8, order: 1 },
        { name: "Estiramiento guiado", duration: 8, order: 2 },
      ],
    });
  }

  return result;
};

const addGenericFallbackPlan = (input: PersonalPlanInput): TemplateSession[] => {
  const minutes = input.sessionMinutes ?? 30;
  const categoryName = input.category.toLowerCase();

  return [
    {
      name: "Preparación",
      order: 1,
      exercises: [
        { name: `Definir avance de ${categoryName}`, duration: Math.max(5, Math.round(minutes * 0.25)), order: 1 },
        { name: "Preparar recursos", duration: Math.max(5, Math.round(minutes * 0.2)), order: 2 },
      ],
    },
    {
      name: "Ejecución",
      order: 2,
      exercises: [
        { name: "Bloque principal de trabajo", duration: Math.max(15, Math.round(minutes * 0.55)), order: 1 },
        { name: "Registrar aprendizaje o avance", duration: 5, order: 2 },
      ],
    },
  ];
};

const applyLevel = (plan: TemplateSession[], level: PlanLevel): TemplateSession[] => {
  const multiplier = level === "advanced" ? 1.15 : level === "beginner" ? 0.85 : 1;

  return plan.map((session) => ({
    ...session,
    exercises: session.exercises.map((exercise: TemplateExercise) => ({
      ...exercise,
      duration: exercise.duration
        ? Math.max(3, Math.round(exercise.duration * multiplier))
        : exercise.duration,
      sets: exercise.sets && level === "beginner"
        ? Math.max(1, exercise.sets - 1)
        : exercise.sets,
    })),
  }));
};

const buildNotes = (
  input: PersonalPlanInput,
  template: GoalTemplate | undefined,
  frequency: number,
) => {
  const notes = [
    template
      ? `Base elegida: ${template.name}.`
      : "Se creó un plan vacío estructurado porque no hubo una plantilla ideal.",
    `Objetivo principal: ${OBJECTIVE_LABELS[input.primaryObjective]}.`,
    `Frecuencia sugerida: ${frequency} días por semana con descanso automático.`,
  ];

  if (input.secondaryObjectives.length > 0) {
    notes.push(
      `Objetivos secundarios: ${input.secondaryObjectives
        .map((objective) => OBJECTIVE_LABELS[objective])
        .join(", ")}.`,
    );
  }

  if (input.deadline) {
    notes.push("El itinerario mantendrá el plan activo hasta la fecha límite.");
  }

  return notes;
};

export const designPersonalPlan = (
  input: PersonalPlanInput,
): PersonalPlanProposal => {
  const template = pickTemplate(input);
  const frequencyPerWeek = getFrequency(input, template);
  const basePlan = getTemplatePlan(template, input.workoutEnvironment);
  const composedPlan = addFitnessModifiers(
    basePlan.length > 0 ? basePlan : addGenericFallbackPlan(input),
    input,
  );
  const plan = applyLevel(composedPlan, input.level);
  const objectiveTitle = OBJECTIVE_LABELS[input.primaryObjective];
  const title =
    input.title?.trim() ||
    template?.name ||
    `Plan de ${objectiveTitle.toLowerCase()}`;

  return {
    title,
    description:
      template?.description ??
      `Plan personal para ${objectiveTitle.toLowerCase()} con sesiones editables.`,
    priority: input.deadline ? "1" : template?.defaultPriority ?? "2",
    template,
    plan,
    frequencyPerWeek,
    plannedWeekdays: calculateAutoWeekdays(frequencyPerWeek),
    primaryObjective: input.primaryObjective,
    secondaryObjectives: input.secondaryObjectives,
    notes: buildNotes(input, template, frequencyPerWeek),
  };
};
