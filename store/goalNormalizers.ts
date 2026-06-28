import { CATEGORY_META } from "./goalConstants";
import { formatYYYYMMDD } from "./dateKeyUtils";
import { genId } from "./idUtils";
import type {
  Goal,
  GoalCategory,
  GoalObjective,
  GoalPriority,
  GoalStatus,
  GoalType,
  Step,
} from "./goalTypes";

const clampFrequency = (value: unknown) => {
  const n = typeof value === "number" ? Math.round(value) : 7;
  return Math.min(7, Math.max(1, n));
};

const normalizeWeekdays = (value: unknown) =>
  Array.isArray(value)
    ? Array.from(
        new Set(
          value
            .map((day) => (typeof day === "number" ? Math.round(day) : -1))
            .filter((day) => day >= 0 && day <= 6),
        ),
      )
    : undefined;

const VALID_OBJECTIVES: GoalObjective[] = [
  "strength",
  "hypertrophy",
  "fatLoss",
  "endurance",
  "mobility",
  "habit",
  "exam",
  "project",
  "career",
  "wellness",
  "finance",
  "custom",
];

const normalizeObjective = (value: unknown): GoalObjective | undefined =>
  VALID_OBJECTIVES.includes(value as GoalObjective)
    ? (value as GoalObjective)
    : undefined;

const normalizeObjectiveList = (value: unknown): GoalObjective[] =>
  Array.isArray(value)
    ? Array.from(
        new Set(
          value
            .map(normalizeObjective)
            .filter((item): item is GoalObjective => Boolean(item)),
        ),
      )
    : [];

/**
 * Normaliza un paso persistido o parcial.
 * Esto protege migraciones, backups y formularios incompletos.
 */
export const normalizeStep = (raw: any): Step => ({
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

/**
 * Normaliza una meta completa con defaults seguros.
 * Se usa al crear, editar, migrar y restaurar datos.
 */
export const normalizeGoal = (raw: any): Goal => {
  const gid = typeof raw?.id === "string" && raw.id ? raw.id : genId("goal-");
  const steps = Array.isArray(raw?.steps) ? raw.steps.map(normalizeStep) : [];
  const cat = (raw?.category as GoalCategory) ?? "Otro";
  const meta = CATEGORY_META[cat] ?? CATEGORY_META.Otro;

  return {
    id: gid,
    title: typeof raw?.title === "string" ? raw.title : "Nueva Meta",
    description:
      typeof raw?.description === "string" ? raw.description : undefined,
    createdAt:
      typeof raw?.createdAt === "string"
        ? raw.createdAt
        : formatYYYYMMDD(new Date()),
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
    frequencyPerWeek: clampFrequency(raw?.frequencyPerWeek),
    restStrategy: "auto",
    plannedWeekdays: normalizeWeekdays(raw?.plannedWeekdays),
    primaryObjective: normalizeObjective(raw?.primaryObjective),
    secondaryObjectives: normalizeObjectiveList(raw?.secondaryObjectives),
    planNotes: Array.isArray(raw?.planNotes)
      ? raw.planNotes.filter((note: unknown): note is string => typeof note === "string")
      : [],
    sessionRotation:
      raw?.sessionRotation === "fixed" ? "fixed" : "activeDays",
  };
};
