import { getTodayKey } from "./ItineraryUtils";
import { CATEGORY_META } from "./goalConstants";
import { normalizeGoal, normalizeStep } from "./goalNormalizers";
import type {
  Goal,
  GoalCategory,
  GoalObjective,
  GoalPriority,
  GoalType,
  ScheduleBlock,
  Step,
  WorkoutEnvironment,
} from "./goalTypes";
import { genId } from "./idUtils";
import { calculateStreaks } from "./streakUtils";
import { emitEvent } from "./storeEvents";
import type { GoalsState } from "./storeTypes";

type StoreSet = (
  partial:
    | Partial<GoalsState>
    | GoalsState
    | ((state: GoalsState) => Partial<GoalsState> | GoalsState),
) => void;

type StoreGet = () => GoalsState;

type GoalsSlice = Pick<
  GoalsState,
  | "addGoalSafe"
  | "createGoalFromTemplate"
  | "createSmartGoal"
  | "updateGoal"
  | "deleteGoal"
  | "addStep"
  | "updateStep"
  | "deleteStep"
  | "toggleStep"
  | "reorderSteps"
  | "rescheduleStep"
  | "reorderItinerary"
  | "setStepsForGoal"
>;

/**
 * Acciones de creación, edición y pasos de metas.
 * Mantiene fuera del store principal las reglas de CRUD y limpieza relacionada.
 */
export const createGoalsSlice = (set: StoreSet, get: StoreGet): GoalsSlice => ({

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
  const secondaryObjectives = Array.isArray(overrides?.secondaryObjectives)
    ? (overrides.secondaryObjectives as GoalObjective[])
    : tpl.secondaryObjectives ?? [];

  // Si el formulario ya trae pasos editados, respetamos esos pasos.
  // Si no, construimos los pasos desde el plan elegido por plantilla/entorno.
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
    plan.forEach((session) => {
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
    createdAt:
      typeof overrides?.createdAt === "string"
        ? overrides.createdAt
        : getTodayKey(),
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
      : plan.length > 0
        ? plan
        : tpl.defaultPlan ?? undefined,
    totalFocusMinutes: finalSteps.reduce((acc, st) => acc + (st.duration || 0), 0),
    order:
      typeof overrides?.order === "number"
        ? overrides.order
        : get().goalIds.length + 1,
    muscleGroups: Array.isArray(tpl.muscleGroups) ? tpl.muscleGroups : undefined,
    workoutStyle: overrides?.workoutStyle ?? tpl.workoutStyle,
workoutEnvironment,
    frequencyPerWeek:
      typeof overrides?.frequencyPerWeek === "number"
        ? overrides.frequencyPerWeek
        : tpl.frequencyPerWeek ?? 7,
    restStrategy: "auto",
    plannedWeekdays: Array.isArray(overrides?.plannedWeekdays)
      ? overrides.plannedWeekdays
      : undefined,
    completedDates: Array.isArray(overrides?.completedDates)
      ? overrides.completedDates
      : [],
    primaryObjective:
      (overrides?.primaryObjective as GoalObjective | undefined) ??
      tpl.primaryObjectives?.[0],
    secondaryObjectives,
    planNotes: Array.isArray(overrides?.planNotes)
      ? overrides.planNotes
      : [],
    sessionRotation: overrides?.sessionRotation ?? "activeDays",
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
    createdAt: getTodayKey(),
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
    frequencyPerWeek: overrides?.frequencyPerWeek ?? 7,
    restStrategy: "auto",
    plannedWeekdays: overrides?.plannedWeekdays,
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
});

