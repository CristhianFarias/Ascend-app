import { getTodayKey } from "./ItineraryUtils";
import { DEFAULT_TEMPLATES } from "./goalTemplates";
import { normalizeGoal } from "./goalNormalizers";
import type { FocusSession, Goal, GoalTemplate, ScheduleBlock } from "./goalTypes";
import { DEFAULT_SETTINGS } from "./storeDefaults";
import type { GoalsState } from "./storeTypes";

type StoreSet = (
  partial:
    | Partial<GoalsState>
    | GoalsState
    | ((state: GoalsState) => Partial<GoalsState> | GoalsState),
) => void;

type StoreGet = () => GoalsState;

/**
 * Acciones de ajustes, onboarding y manejo manual de datos.
 * Están separadas porque no pertenecen al núcleo de metas/agenda/focus.
 */
export const createSettingsDataSlice = (set: StoreSet, get: StoreGet) => ({
  setAccentColor: (accentColor: string) =>
    set((state) => ({
      settings: { ...state.settings, accentColor },
      _version: state._version + 1,
    })),

  setAvailableTimeBlocks: (
    availableTimeBlocks: GoalsState["settings"]["availableTimeBlocks"],
  ) =>
    set((state) => ({
      settings: { ...state.settings, availableTimeBlocks },
      _version: state._version + 1,
    })),

  setTheme: (theme: GoalsState["settings"]["theme"]) =>
    set((state) => ({
      settings: { ...state.settings, theme },
      _version: state._version + 1,
    })),

  setMinimalMode: (minimalMode: boolean) =>
    set((state) => ({
      settings: { ...state.settings, minimalMode },
      _version: state._version + 1,
    })),

  completeOnboarding: () =>
    set((state) => ({
      hasFinishedOnboarding: true,
      _version: state._version + 1,
    })),

  isTodayMarked: () => {
    const today = getTodayKey();
    const completedToday = get().dailyCompletionMap[today] ?? [];
    return completedToday.length > 0;
  },

  markTodayComplete: () => get().markTodayCompleteIfEligible(),

  resetAll: () =>
    set(() => ({
      goalsById: {},
      goalIds: [],
      settings: { ...DEFAULT_SETTINGS },
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

  backupToJSON: () => {
    const state = get();

    return JSON.stringify({
      storeVersion: state.storeVersion,
      goalsById: state.goalsById,
      goalIds: state.goalIds,
      settings: state.settings,
      externalEvents: state.externalEvents,
      dailyCompletionMap: state.dailyCompletionMap,
      dailySchedule: state.dailySchedule,
      dailySchedulesByDate: state.dailySchedulesByDate,
      hasFinishedOnboarding: state.hasFinishedOnboarding,
      focusSession: state.focusSession,
      globalStreak: state.globalStreak,
      bestStreak: state.bestStreak,
      lastRolloverDate: state.lastRolloverDate,
      templates: state.templates,
    });
  },

  restoreFromJSON: (json: string) => {
    try {
      const parsed = JSON.parse(json);
      if (!parsed) return;

      const safeGoalsById: Record<string, Goal> = {};
      if (parsed.goalsById && typeof parsed.goalsById === "object") {
        Object.keys(parsed.goalsById).forEach((key) => {
          safeGoalsById[key] = normalizeGoal(parsed.goalsById[key]);
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

      const safeDailySchedule: ScheduleBlock[] = Array.isArray(
        parsed.dailySchedule,
      )
        ? parsed.dailySchedule
        : [];

      const safeTemplates: GoalTemplate[] =
        Array.isArray(parsed.templates) && parsed.templates.length > 0
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
        bestStreak:
          typeof parsed.bestStreak === "number" ? parsed.bestStreak : 0,
        lastRolloverDate:
          typeof parsed.lastRolloverDate === "string"
            ? parsed.lastRolloverDate
            : undefined,
        templates: safeTemplates,
        _version: Date.now(),
      }));
    } catch (error) {
      console.warn("restoreFromJSON error", error);
    }
  },
});
