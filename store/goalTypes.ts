import type { ItineraryItem } from "./ItineraryUtils";

/**
 * Tipos principales del dominio de Ascend.
 * Mantenerlos aquí evita que el store mezcle modelo de datos con acciones.
 */
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
export type RestStrategy = "auto";
export type TimeBlock = { start: string; end: string };
export type GoalObjective =
  | "strength"
  | "hypertrophy"
  | "fatLoss"
  | "endurance"
  | "mobility"
  | "habit"
  | "exam"
  | "project"
  | "career"
  | "wellness"
  | "finance"
  | "custom";

export type Step = {
  id: string;
  title: string;
  duration: number;
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
  duration?: number;
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
  primaryObjectives?: GoalObjective[];
  secondaryObjectives?: GoalObjective[];
  flexibilityTags?: string[];
};

export type Goal = {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
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
  frequencyPerWeek: number;
  restStrategy: RestStrategy;
  plannedWeekdays?: number[];
  primaryObjective?: GoalObjective;
  secondaryObjectives?: GoalObjective[];
  planNotes?: string[];
  sessionRotation?: "activeDays" | "fixed";
};

export type FocusPhase = "work" | "rest" | "idle";

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

export type Conflict = {
  item1: ItineraryItem;
  item2: ItineraryItem;
  overlapMinutes: number;
};
