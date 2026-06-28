import {
  buildItineraryForDate,
  computeItinerarySummary,
  detectConflicts,
  findNextItem,
  getTodayKey,
  normalizeItinerary,
  type ItineraryItem,
} from "./ItineraryUtils";
import { CATEGORY_META } from "./goalConstants";
import { isGoalScheduledForDate } from "./goalScheduleUtils";
import type {
  Conflict,
  Goal,
  GoalCategory,
  HeatmapItem,
  ScheduleBlock,
} from "./goalTypes";
import {
  expandStepsForBlock,
  mergeScheduleBlocks,
  reorderMergedScheduleBlocks,
  shouldMirrorTodaySchedule,
} from "./scheduleMergeUtils";
import { buildStats } from "./statsUtils";
import { emitEvent } from "./storeEvents";
import type { GoalsState } from "./storeTypes";

type StoreSet = (
  partial:
    | Partial<GoalsState>
    | GoalsState
    | ((state: GoalsState) => Partial<GoalsState> | GoalsState),
) => void;

type StoreGet = () => GoalsState;

type SelectorsSlice = Pick<
  GoalsState,
  | "getGoalsList"
  | "getGoalsListMemo"
  | "getActiveGoalsMemo"
  | "getGoalById"
  | "getTemplatesByCategory"
  | "getCategoryMeta"
  | "getGoalProgress"
  | "getTodayItinerary"
  | "getTodayItineraryMemo"
  | "getTodayItinerarySummary"
  | "getExpandedStepsForBlock"
  | "getMergedScheduleForDate"
  | "reorderMergedScheduleForDate"
  | "findNextItineraryItem"
  | "getItineraryConflicts"
  | "getGlobalStats"
  | "getHeatmapData"
  | "areAllStepsCompleted"
  | "getCompletedGoalsForDate"
  | "getStreakHistory"
>;

const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/**
 * Selectores derivados del store.
 * Conservan cachés por _version para evitar recalcular listas e itinerarios.
 */
export const createSelectorsSlice = (
  set: StoreSet,
  get: StoreGet,
): SelectorsSlice => ({
  getGoalsList: () => {
    const s = get();
    return s.goalIds.map((id) => s.goalsById[id]).filter(Boolean);
  },

  getGoalsListMemo: (() => {
    let cacheVersion = -1;
    let cacheValue: Goal[] = [];
    return () => {
      const s = get();
      if (s._version === cacheVersion) return cacheValue;
      cacheValue = s.goalIds.map((id) => s.goalsById[id]).filter(Boolean);
      cacheVersion = s._version;
      return cacheValue;
    };
  })(),

  getActiveGoalsMemo: (() => {
    let cacheVersion = -1;
    let cacheValue: Goal[] = [];
    return () => {
      const s = get();
      if (s._version === cacheVersion) return cacheValue;
      cacheValue = s.getGoalsListMemo().filter((g) => g.status === "active");
      cacheVersion = s._version;
      return cacheValue;
    };
  })(),

  getGoalById: (id) => get().goalsById[id],

  getTemplatesByCategory: (c) =>
    get().templates.filter((template) => template.category === c),

  getCategoryMeta: (c: GoalCategory) => CATEGORY_META[c] ?? CATEGORY_META.Otro,

  getGoalProgress: (id) => {
    const goal = get().goalsById[id];
    if (!goal) return { total: 0, completed: 0, percent: 0 };

    const total = goal.steps.length;
    const completed = goal.steps.filter((step) => step.completed).length;

    return {
      total,
      completed,
      percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    };
  },

  getTodayItinerary: () => {
    const s = get();
    const today = getTodayKey();

    // Primero usa la agenda guardada de hoy; si no existe, genera una vista desde metas activas.
    const storedForToday = s.getDailyScheduleForDate(today) as any[];
    const raw: Partial<ItineraryItem>[] =
      Array.isArray(storedForToday) && storedForToday.length > 0
        ? storedForToday
        : (buildItineraryForDate(
            s
              .getActiveGoalsMemo()
              .filter((goal) => isGoalScheduledForDate(goal, today)),
            new Date(),
          ) as any);

    return normalizeItinerary(raw).map((item) => {
      const meta = { ...(item.metadata || {}) };

      if (item.stepId && item.goalId) {
        const goal = s.goalsById[item.goalId];
        const step = goal?.steps?.find((x) => x.id === item.stepId);
        meta.completed = Boolean(step?.completed);
        if (!item.color && goal) item.color = goal.color;
      } else {
        meta.completed = Boolean(item.metadata?.completed);
        if (!item.color && item.goalId) {
          const goal = s.goalsById[item.goalId];
          if (goal) item.color = goal.color;
        }
      }

      return { ...item, metadata: meta };
    });
  },

  getTodayItineraryMemo: (() => {
    let cacheVersion = -1;
    let cacheValue: ItineraryItem[] = [];
    return () => {
      const s = get();
      if (s._version === cacheVersion) return cacheValue;
      cacheValue = s.getTodayItinerary();
      cacheVersion = s._version;
      return cacheValue;
    };
  })(),

  getTodayItinerarySummary: (() => {
    let cacheVersion = -1;
    let cacheValue = {
      totalMinutes: 0,
      completedMinutes: 0,
      percentDone: 0,
    };
    return () => {
      const s = get();
      if (s._version === cacheVersion) return cacheValue;
      cacheValue = computeItinerarySummary(s.getTodayItineraryMemo());
      cacheVersion = s._version;
      return cacheValue;
    };
  })(),

  getExpandedStepsForBlock: (block) => {
    const s = get();
    const goal = block.goalId ? s.goalsById[block.goalId] : undefined;
    return expandStepsForBlock(block, goal);
  },

  getMergedScheduleForDate: (date) => {
    const s = get();
    const key = date ?? getTodayKey();

    // Lee horario por fecha; si no existe, conserva compatibilidad con dailySchedule.
    const raw: ScheduleBlock[] =
      s.dailySchedulesByDate?.[key]?.length > 0
        ? s.dailySchedulesByDate[key]
        : s.dailySchedule || [];

    return mergeScheduleBlocks(raw);
  },

  reorderMergedScheduleForDate: (date, ordered) => {
    const s = get();
    const raw: ScheduleBlock[] =
      s.dailySchedulesByDate?.[date]?.length > 0
        ? s.dailySchedulesByDate[date]
        : s.dailySchedule || [];

    const recalculated = reorderMergedScheduleBlocks(raw, ordered);

    if (recalculated.length === 0) {
      set((st) => ({
        dailySchedulesByDate: {
          ...(st.dailySchedulesByDate || {}),
          [date]: [],
        },
        dailySchedule: shouldMirrorTodaySchedule(date) ? [] : st.dailySchedule,
        _version: st._version + 1,
      }));
      emitEvent("itinerary.changed");
      return [];
    }

    set((st) => ({
      dailySchedulesByDate: {
        ...(st.dailySchedulesByDate || {}),
        [date]: recalculated,
      },
      dailySchedule: shouldMirrorTodaySchedule(date)
        ? recalculated
        : st.dailySchedule,
      _version: st._version + 1,
    }));

    emitEvent("itinerary.changed");
    return recalculated;
  },

  findNextItineraryItem: (() => {
    let cacheVersion = -1;
    let cacheValue: ItineraryItem | null = null;
    return () => {
      const s = get();
      if (s._version === cacheVersion) return cacheValue;
      cacheValue = findNextItem(s.getTodayItineraryMemo());
      cacheVersion = s._version;
      return cacheValue;
    };
  })(),

  getItineraryConflicts: (() => {
    let cacheVersion = -1;
    let cacheValue: Conflict[] = [];
    return () => {
      const s = get();
      if (s._version === cacheVersion) return cacheValue;
      cacheValue = detectConflicts(s.getTodayItineraryMemo());
      cacheVersion = s._version;
      return cacheValue;
    };
  })(),

  getGlobalStats: (() => {
    let cacheVersion = -1;
    let cacheValue: ReturnType<GoalsState["getGlobalStats"]> | null = null;
    return () => {
      const s = get();
      if (s._version === cacheVersion && cacheValue) return cacheValue;

      const base = buildStats(
        s.getGoalsListMemo(),
        s.globalStreak ?? 0,
        s.bestStreak ?? 0,
      );
      cacheValue = { ...base, recentDays: s.getHeatmapData("week") };
      cacheVersion = s._version;
      return cacheValue;
    };
  })(),

  getHeatmapData: (range = "month") => {
    const s = get();
    const daysBack = range === "week" ? 7 : range === "month" ? 30 : 365;
    const result: HeatmapItem[] = [];
    const today = new Date();

    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = formatDateKey(d);
      const goalIds = s.dailyCompletionMap[key] ?? [];

      result.push({
        date: key,
        completed: goalIds.length > 0,
        count: goalIds.length,
        goalIds,
      });
    }

    return result;
  },

  areAllStepsCompleted: (goalId) => {
    const goal = get().goalsById[goalId];
    if (!goal || !goal.steps || goal.steps.length === 0) return false;
    return goal.steps.every((step) => step.completed);
  },

  getCompletedGoalsForDate: (date) => get().dailyCompletionMap[date] ?? [],

  getStreakHistory: (() => {
    const caches: Record<
      string,
      { version: number; value: { date: string; streak: number }[] }
    > = {};

    return (range = "month") => {
      const s = get();
      const key = range;
      if (!caches[key]) caches[key] = { version: -1, value: [] };

      const cache = caches[key];
      if (s._version === cache.version) return cache.value;

      const daysBack = range === "week" ? 7 : range === "month" ? 30 : 365;
      const today = new Date();
      const history: { date: string; streak: number }[] = [];
      const map = s.dailyCompletionMap || {};
      const activeGoals = s.goalIds
        .map((id) => s.goalsById[id])
        .filter((goal) => goal && goal.status === "active" && goal.steps.length > 0)
        .map((goal) => goal.id);

      if (activeGoals.length === 0) {
        cache.value = history;
        cache.version = s._version;
        return history;
      }

      const dateHasAllActive = (dateKey: string) => {
        const completedIds = map[dateKey] ?? [];
        return activeGoals.every((id) => completedIds.includes(id));
      };

      for (let i = daysBack - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const keyDate = formatDateKey(d);
        let streak = 0;
        const checkDate = new Date(d);

        while (dateHasAllActive(formatDateKey(checkDate))) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }

        history.push({ date: keyDate, streak });
      }

      cache.value = history.reverse();
      cache.version = s._version;
      return cache.value;
    };
  })(),
});
