import type { GoalsState } from "./storeTypes";

type PersistedGoalsState = Pick<
  GoalsState,
  | "goalsById"
  | "goalIds"
  | "settings"
  | "externalEvents"
  | "dailyCompletionMap"
  | "storeVersion"
  | "templates"
  | "dailySchedule"
  | "dailySchedulesByDate"
  | "hasFinishedOnboarding"
  | "globalStreak"
  | "bestStreak"
  | "lastRolloverDate"
>;

/**
 * Define qué parte del store vive en AsyncStorage.
 * Dejamos fuera funciones, cachés internos, eventos y sesiones Focus activas.
 */
export const selectPersistedState = (
  state: GoalsState,
): PersistedGoalsState => ({
  goalsById: state.goalsById,
  goalIds: state.goalIds,
  settings: state.settings,
  externalEvents: state.externalEvents,
  dailyCompletionMap: state.dailyCompletionMap,
  storeVersion: state.storeVersion,
  templates: state.templates,
  dailySchedule: state.dailySchedule,
  dailySchedulesByDate: state.dailySchedulesByDate,
  hasFinishedOnboarding: state.hasFinishedOnboarding,
  globalStreak: state.globalStreak,
  bestStreak: state.bestStreak,
  lastRolloverDate: state.lastRolloverDate,
});
