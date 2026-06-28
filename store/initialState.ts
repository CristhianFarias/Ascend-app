import { DEFAULT_TEMPLATES } from "./goalTemplates";
import {
  DEFAULT_EXTERNAL_EVENTS,
  DEFAULT_SETTINGS,
  STORE_VERSION,
} from "./storeDefaults";
import type { GoalsState } from "./storeTypes";

type InitialGoalsState = Pick<
  GoalsState,
  | "goalsById"
  | "goalIds"
  | "settings"
  | "externalEvents"
  | "dailyCompletionMap"
  | "storeVersion"
  | "_version"
  | "templates"
  | "dailySchedule"
  | "dailySchedulesByDate"
  | "hasFinishedOnboarding"
  | "focusSession"
  | "_events"
  | "globalStreak"
  | "bestStreak"
  | "lastRolloverDate"
>;

/**
 * Estado base al abrir la app por primera vez.
 * Se crea como función para evitar compartir referencias mutables entre reinicios.
 */
export const createInitialGoalsState = (): InitialGoalsState => ({
  goalsById: {},
  goalIds: [],
  settings: DEFAULT_SETTINGS,
  externalEvents: DEFAULT_EXTERNAL_EVENTS,
  dailyCompletionMap: {},
  storeVersion: STORE_VERSION,
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
});
