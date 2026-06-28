import { getTodayKey } from "./ItineraryUtils";
import { parseYYYYMMDD } from "./dateKeyUtils";
import { getGoalStepsForDate, isGoalScheduledForDate } from "./goalScheduleUtils";
import type { Goal } from "./goalTypes";
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

/**
 * Acciones relacionadas con progreso diario, rachas y rollover.
 * Mantenerlas juntas evita mezclar reglas de progreso con CRUD de metas.
 */
export const createProgressSlice = (set: StoreSet, get: StoreGet) => ({
  markGoalCompletedToday: (goalId: string) => {
    const today = getTodayKey();

    set((state) => {
      const goal = state.goalsById[goalId];
      if (!goal) return state;

      const map = { ...(state.dailyCompletionMap || {}) };
      const current = Array.isArray(map[today]) ? map[today] : [];
      map[today] = Array.from(new Set([...current, goalId]));

      const completedDates = Array.from(
        new Set([...(goal.completedDates || []), today]),
      );

      const newState = {
        ...state,
        dailyCompletionMap: map,
        goalsById: {
          ...state.goalsById,
          [goalId]: {
            ...goal,
            completedDates,
          },
        },
        _version: state._version + 1,
      };

      return {
        ...newState,
        ...calculateStreaks(newState),
      };
    });

    emitEvent("goal.markedToday", { goalId });
  },

  unmarkGoalCompletedToday: (goalId: string) => {
    const today = getTodayKey();

    set((state) => {
      const goal = state.goalsById[goalId];
      if (!goal) return state;

      const map = { ...(state.dailyCompletionMap || {}) };
      const nextToday = (map[today] || []).filter((id) => id !== goalId);

      if (nextToday.length > 0) map[today] = nextToday;
      else delete map[today];

      const completedDates = (goal.completedDates || []).filter(
        (date) => date !== today,
      );

      const newState = {
        ...state,
        dailyCompletionMap: map,
        goalsById: {
          ...state.goalsById,
          [goalId]: {
            ...goal,
            completedDates,
          },
        },
        _version: state._version + 1,
      };

      return {
        ...newState,
        ...calculateStreaks(newState),
      };
    });

    emitEvent("goal.unmarkedToday", { goalId });
  },

  markTodayCompleteIfEligible: () => {
    const today = getTodayKey();
    const scheduledGoals = get()
      .getActiveGoalsMemo()
      .filter((goal) => isGoalScheduledForDate(goal, today));
    if (scheduledGoals.length === 0) return false;

    const allEligible = scheduledGoals.every((goal) => {
      const todaySteps = getGoalStepsForDate(goal, today);
      return (
        todaySteps.length > 0 && todaySteps.every((step) => step.completed)
      );
    });

    if (!allEligible) return false;

    scheduledGoals.forEach((goal) => get().markGoalCompletedToday(goal.id));
    return true;
  },

  recalculateStreaks: () => {
    set((state) => ({
      ...state,
      ...calculateStreaks(state),
      _version: state._version + 1,
    }));
  },

  performDailyRollover: (today?: string) => {
    const todayKey = today ?? getTodayKey();
    const state = get();

    if (state.lastRolloverDate === todayKey) {
      return { rolled: false, archivedGoals: [] };
    }

    const archivedGoals: string[] = [];
    const updatedGoalsById: Record<string, Goal> = { ...state.goalsById };

    Object.keys(updatedGoalsById).forEach((goalId) => {
      const goal = updatedGoalsById[goalId];
      if (!goal) return;

      if (goal.deadline) {
        const deadline = parseYYYYMMDD(goal.deadline);
        const todayDate = parseYYYYMMDD(todayKey);

        if (deadline.getTime() < todayDate.getTime()) {
          updatedGoalsById[goalId] = { ...goal, status: "archived" };
          archivedGoals.push(goalId);
          return;
        }
      }

      if (
        goal.status === "active" &&
        Array.isArray(goal.steps) &&
        goal.steps.length > 0
      ) {
        updatedGoalsById[goalId] = {
          ...goal,
          steps: goal.steps.map((step) => ({
            ...step,
            completed: false,
          })),
        };
      }
    });

    const newState: Partial<GoalsState> = {
      goalsById: updatedGoalsById,
      lastRolloverDate: todayKey,
      focusSession: null,
      _version: state._version + 1,
    };

    const streaks = calculateStreaks({
      ...state,
      ...newState,
    } as GoalsState);

    set((previous) => ({
      ...previous,
      ...newState,
      ...streaks,
    }));

    emitEvent("daily.rollover", { date: todayKey, archivedGoals });
    emitEvent("itinerary.changed");

    return { rolled: true, archivedGoals };
  },

  rolloverIfNeeded: (today?: string) => get().performDailyRollover(today),
});
