import { formatYYYYMMDD, parseYYYYMMDD } from "./dateKeyUtils";
import type { Goal, Step } from "./goalTypes";

/**
 * Mantiene la frecuencia en un rango útil para repartir sesiones semanales.
 */
export const sanitizeFrequency = (value: unknown) => {
  const n = typeof value === "number" ? Math.round(value) : 7;
  return Math.min(7, Math.max(1, n));
};

/**
 * Días activos automáticos. getDay(): 0 domingo, 1 lunes ... 6 sábado.
 * Se prefieren separaciones cuando la frecuencia lo permite.
 */
export const calculateAutoWeekdays = (frequency: number): number[] => {
  const f = sanitizeFrequency(frequency);
  const presets: Record<number, number[]> = {
    1: [1],
    2: [1, 4],
    3: [1, 3, 5],
    4: [1, 2, 4, 6],
    5: [1, 2, 3, 4, 5],
    6: [1, 2, 3, 4, 5, 6],
    7: [0, 1, 2, 3, 4, 5, 6],
  };
  return presets[f];
};

export const getGoalWeekdays = (goal: Goal) =>
  Array.isArray(goal.plannedWeekdays) && goal.plannedWeekdays.length > 0
    ? goal.plannedWeekdays
    : calculateAutoWeekdays(goal.frequencyPerWeek);

export const isGoalPastDeadline = (goal: Goal, dateKey: string) =>
  Boolean(
    goal.deadline &&
      parseYYYYMMDD(goal.deadline).getTime() < parseYYYYMMDD(dateKey).getTime(),
  );

/**
 * Decide si una meta debe aparecer en la fecha indicada.
 * El deadline no obliga a todos los días: solo mantiene la meta elegible hasta vencer.
 */
export const isGoalScheduledForDate = (goal: Goal, dateKey: string) => {
  if (goal.status !== "active") return false;
  if (isGoalPastDeadline(goal, dateKey)) return false;
  return getGoalWeekdays(goal).includes(parseYYYYMMDD(dateKey).getDay());
};

const getSessionNames = (goal: Goal) =>
  Array.isArray(goal.plan)
    ? goal.plan
        .map((session) => session.name)
        .filter((name): name is string => typeof name === "string" && !!name)
    : [];

export const countActiveDaysBetween = (
  goal: Goal,
  startKey: string,
  endKey: string,
) => {
  const start = parseYYYYMMDD(startKey);
  const end = parseYYYYMMDD(endKey);
  if (end.getTime() < start.getTime()) return 0;

  let count = 0;
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    if (isGoalScheduledForDate(goal, formatYYYYMMDD(cursor))) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
};

/**
 * Rota sesiones por día activo para no meter todo el plan en una sola fecha.
 */
export const getSessionNameForDate = (goal: Goal, dateKey: string) => {
  const sessionNames = getSessionNames(goal);
  if (sessionNames.length === 0) return undefined;

  const startKey = goal.createdAt || dateKey;
  const activeCount = Math.max(1, countActiveDaysBetween(goal, startKey, dateKey));
  return sessionNames[(activeCount - 1) % sessionNames.length];
};

export const getGoalStepsForDate = (goal: Goal, dateKey: string): Step[] => {
  if (!isGoalScheduledForDate(goal, dateKey)) return [];

  const sessionName = getSessionNameForDate(goal, dateKey);
  if (!sessionName) return goal.steps;

  const sessionSteps = goal.steps.filter((step) => step.session === sessionName);
  return sessionSteps.length > 0 ? sessionSteps : goal.steps;
};

export const getEligibleStepsForDate = (goal: Goal, dateKey: string): Step[] => {
  return getGoalStepsForDate(goal, dateKey).filter((step) => !step.completed);
};

export const getRemainingActiveDaysUntilDeadline = (
  goal: Goal,
  dateKey: string,
) => {
  if (!goal.deadline) return undefined;
  return countActiveDaysBetween(goal, dateKey, goal.deadline);
};

export const getRequiredSessionDays = (goal: Goal) => {
  const pending = goal.steps.filter((step) => !step.completed);
  if (pending.length === 0) return 0;

  const sessions = new Set(
    pending
      .map((step) => step.session)
      .filter((session): session is string => typeof session === "string"),
  );
  return sessions.size > 0 ? sessions.size : 1;
};
